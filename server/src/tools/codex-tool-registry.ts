import { codexToolSchemas } from "./schemas";

export function listCodexTools() {
  return codexToolSchemas;
}

export function getCodexTool(name: string) {
  return codexToolSchemas.find((tool) => tool.name === name) ?? null;
}

