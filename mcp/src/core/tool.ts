import type { z } from "zod";

export type ToolInput = z.ZodRawShape;

export interface Tool<Input extends ToolInput = ToolInput> {
  name: string;
  title?: string;
  description: string;
  input: Input;
  execute(input: z.infer<z.ZodObject<Input>>): Promise<unknown>;
}
export class ToolResult {
  constructor(
    readonly text: string,
    readonly images: { data: string; mimeType: string }[] = [],
  ) {}
}
export const defineTool = <Input extends ToolInput>(tool: Tool<Input>): Tool<Input> => tool;
