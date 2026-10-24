import { z } from "zod";

export const FIGMA_EXTRACT_DESCRIPTION =
  "Extrai o design de um node do Figma (e filhos, recursivamente) pelo Chrome do usuário: hierarquia, posição/tamanho, " +
  "cores, bordas, raios, tipografia, auto-layout, efeitos, variáveis (com valor resolvido), estilos e componentes/variantes. " +
  "Funciona também em arquivos só de leitura. Saída em texto compacto com definições deduplicadas (paints pN, textos tN, efeitos eN, componentes kN). " +
  "Cada componente usado traz, uma vez, a árvore interna, as propriedades possíveis, a descrição e a comparação com as outras variantes; " +
  "ícones vêm com nome (e SVG opcional); também vêm anotações do designer, ações de protótipo (flow:) e o índice de tokens. " +
  "Para detalhar um filho, chame de novo com o mesmo url e o nodeId dele.";

export const figmaExtractInput = {
  url: z.string().describe("URL do Figma com node-id, ex.: https://www.figma.com/design/KEY/Nome?node-id=84-1618"),
  nodeId: z.string().optional().describe("Outro node do mesmo arquivo (ex.: 84:1700); sobrepõe o node-id da URL"),
  depth: z.number().int().min(0).max(50).default(4).describe("Profundidade máxima a partir do node"),
  maxNodes: z.number().int().min(1).max(2000).default(300).describe("Teto de nós extraídos"),
  expandInstances: z.boolean().default(false).describe("Expande a árvore das instâncias (padrão: só componente + overrides)"),
  includeHidden: z.boolean().default(false).describe("Inclui nós invisíveis"),
  icons: z.enum(["name", "svg"]).default("name").describe("Ícones: só o nome (padrão) ou nome + SVG exportado"),
  variants: z.boolean().default(true).describe("Compara as outras variantes de cada component set com a variante usada"),
  image: z.boolean().default(false).describe("Anexa PNG do node (lado maior ≤ 1024px, ~0.4–1.4k tokens)"),
};
