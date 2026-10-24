import userAgents from "./user-agents.json" with { type: "json" };

export const randomUserAgent = (): string => userAgents[Math.floor(Math.random() * userAgents.length)];
