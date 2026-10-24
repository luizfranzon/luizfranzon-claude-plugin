import { z } from "zod";
import { defineTool } from "../../core/tool";
import { evaluate, extensionStatus, listTabs } from "../../infrastructure/extension/bridge";

export const chromeTabsTool = defineTool({
  name: "chrome_tabs",
  description: "Lista as abas abertas no Chrome do usuário (via extensão). Devolve id, url e título de cada uma.",
  input: {},
  execute: () => listTabs(),
});

export const chromeEvalTool = defineTool({
  name: "chrome_eval",
  description:
    "Executa uma expressão JavaScript numa aba do Chrome do usuário, com a sessão logada dele, e devolve o valor (serializado em JSON). " +
    "Promises são aguardadas. Devolva só o necessário: o resultado inteiro volta para o contexto.",
  input: {
    tabId: z.number().int().describe("id da aba, obtido com chrome_tabs"),
    expression: z.string().describe("Expressão JS, ex.: document.title ou (async () => { ... })()"),
  },
  execute: ({ tabId, expression }) => evaluate(tabId, expression),
});

export const chromeStatusTool = defineTool({
  name: "chrome_status",
  description:
    "Mostra se a extensão do Chrome está conectada, a versão que ela informou e a versão esperada pelo MCP. " +
    "Se upToDate for false, a extensão carregada no Chrome está desatualizada: recarregue-a em chrome://extensions.",
  input: {},
  execute: async () => extensionStatus(),
});
