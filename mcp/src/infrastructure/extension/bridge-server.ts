import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { WebSocket, WebSocketServer } from "ws";
import { AppError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import type { PendingCalls } from "./pending-calls";

const isExtensionOrigin = ({ origin }: { origin?: string }) => origin?.startsWith("chrome-extension://") === true;

interface ExtensionMessage {
  id?: number;
  type?: string;
  version?: string;
  result?: unknown;
  error?: string;
}

function parseMessage(data: unknown): ExtensionMessage | undefined {
  try {
    return JSON.parse(String(data));
  } catch {
    return undefined;
  }
}

export class BridgeServer {
  private server?: WebSocketServer;
  private socket?: WebSocket;
  private version?: string;

  constructor(
    private readonly calls: PendingCalls,
    private readonly onHello: (version?: string) => void,
  ) {}

  get extensionVersion(): string | undefined {
    return this.version;
  }

  get listening(): boolean {
    return Boolean(this.server?.address());
  }

  get hasSocket(): boolean {
    return this.socket !== undefined;
  }

  async start(port: number): Promise<number> {
    const server = new WebSocketServer({ host: "127.0.0.1", port, verifyClient: isExtensionOrigin });
    this.server = server;
    server.on("connection", (ws) => this.adopt(ws));
    server.on("error", (error) => logger.error("Ponte da extensão do Chrome indisponível", error));
    await once(server, "listening");
    return (server.address() as AddressInfo).port;
  }

  async stop(): Promise<void> {
    const server = this.server;
    if (!server) return;
    for (const client of server.clients) client.terminate();
    await new Promise((resolve) => server.close(resolve));
    this.server = this.socket = undefined;
  }

  async waitForConnection(timeoutMs: number): Promise<void> {
    await once(this.server!, "connection", { signal: AbortSignal.timeout(timeoutMs) });
  }

  assertOpen(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) throw new AppError("A extensão do Chrome desconectou.");
  }

  send(payload: object): void {
    this.assertOpen();
    this.socket!.send(JSON.stringify(payload));
  }

  private adopt(ws: WebSocket): void {
    this.socket?.close();
    this.socket = ws;
    this.version = undefined;
    ws.on("message", (data) => this.receive(data));
    ws.on("close", () => this.release(ws));
  }

  private receive(data: unknown): void {
    const message = parseMessage(data);
    if (!message) return;
    if (message.type === "hello") {
      this.version = message.version;
      this.onHello(message.version);
      return;
    }
    if (message.id === undefined) return;
    this.calls.settle(message.id, message.result, message.error);
  }

  private release(ws: WebSocket): void {
    if (this.socket !== ws) return;
    this.socket = undefined;
    this.version = undefined;
    this.calls.rejectAll(new AppError("A extensão do Chrome desconectou."));
  }
}
