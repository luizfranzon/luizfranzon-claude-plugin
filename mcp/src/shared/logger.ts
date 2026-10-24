function write(level: string, message: string, extra?: unknown): void {
  if (extra === undefined) {
    console.error(`[${level}] ${message}`);
    return;
  }
  console.error(`[${level}] ${message}`, extra);
}

export const logger = {
  info: (message: string, extra?: unknown) => write("info", message, extra),
  error: (message: string, extra?: unknown) => write("error", message, extra),
};
