export class Defs {
  private readonly ids = new Map<string, string>();
  readonly entries: [id: string, line: string][] = [];

  constructor(private readonly prefix: string) {}

  get lines(): string[] {
    return this.entries.map(([, line]) => line);
  }

  ref(value: unknown, render: (id: string) => string): string {
    const key = JSON.stringify(value);
    const existing = this.ids.get(key);
    if (existing) return existing;
    const id = `${this.prefix}${this.ids.size + 1}`;
    this.ids.set(key, id);
    this.entries.push([id, `  ${id} ${render(id)}`]);
    return id;
  }
}
