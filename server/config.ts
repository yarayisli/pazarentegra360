// Central place for runtime configuration. Values are read lazily so tests can change process.env.
export const DEFAULT_PORT = 3000;

export function getPort(): number {
  return DEFAULT_PORT;
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
}
