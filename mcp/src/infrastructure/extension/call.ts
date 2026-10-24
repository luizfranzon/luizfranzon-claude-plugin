import { AppError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import { BridgeServer } from "./bridge-server";
import { PendingCalls } from "./pending-calls";
import { describeStatus, EXPECTED_EXTENSION_VERSION, type ExtensionStatus } from "./version";

export const extensionPort = Number(process.env.MCP_EXTENSION_PORT ?? 17327);

const CALL_TIMEOUT_MS = 30_000;
const CONNECT_TIMEOUT_MS = 35_000;

const calls = new PendingCalls();
function reportHello(version?: string): void {
  if (version === EXPECTED_EXTENSION_VERSION) {
    logger.info(`Extensão do Chrome conectada (v${version})`);
    return;
  }
  logger.error(
    `Extensão do Chrome desatualizada: v${version ?? "desconhecida"}, esperada v${EXPECTED_EXTENSION_VERSION}. Recarregue em chrome://extensions.`,
  );
}

const bridge = new BridgeServer(calls, reportHello);

export const extensionStatus = (): ExtensionStatus => describeStatus(bridge.hasSocket, bridge.extensionVersion);

export const startExtensionBridge = (port = extensionPort) => bridge.start(port);
export const stopExtensionBridge = () => bridge.stop();

async function ensureListening(): Promise<void> {
  if (bridge.listening) return;
  try {
    await bridge.start(extensionPort);
  } catch {
    throw new AppError(`Porta ${extensionPort} da ponte do Chrome ocupada (outra sessão do Claude usando a extensão?).`);
  }
}

async function ensureConnected(): Promise<void> {
  if (bridge.hasSocket) return;
  try {
    await bridge.waitForConnection(CONNECT_TIMEOUT_MS);
  } catch {
    throw new AppError("Extensão do Chrome não conectada. Ela está instalada e ativa?");
  }
}

export async function callExtension(method: string, params?: unknown, timeoutMs = CALL_TIMEOUT_MS): Promise<unknown> {
  await ensureListening();
  await ensureConnected();
  bridge.assertOpen();
  const { id, promise } = calls.register(method, timeoutMs);
  bridge.send({ id, method, params });
  return promise;
}
