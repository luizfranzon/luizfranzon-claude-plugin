import { z } from "zod";
import { defineTool } from "../../core/tool";

export const pingTool = defineTool({
  name: "ping",
  description: "Verifica se o servidor está respondendo. Devolve a mensagem recebida.",
  input: { message: z.string().default("pong") },
  execute: async ({ message }) => message,
});
