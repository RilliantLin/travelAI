export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base =
    API_BASE_URL.startsWith("http") || typeof window === "undefined"
      ? API_BASE_URL
      : `${window.location.origin}${API_BASE_URL.startsWith("/") ? API_BASE_URL : `/${API_BASE_URL}`}`;
  const url = new URL(path.startsWith("http") ? path : `${base}${normalizedPath}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError("后端返回了无效 JSON", response.status);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & {
    params?: Record<string, string | number | boolean | undefined>;
    unwrap?: boolean;
  } = {}
): Promise<T> {
  const { params, unwrap = true, headers, body, ...fetchOptions } = options;
  const response = await fetch(buildUrl(path, params), {
    ...fetchOptions,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body,
  });
  const payload = await parseJson<T>(response);

  if (!response.ok || payload.success === false) {
    throw new ApiClientError(
      payload.error || payload.message || `请求失败：${response.status}`,
      response.status,
      payload.code,
      payload.details
    );
  }

  return (unwrap ? payload.data : payload) as T;
}

export function jsonBody(data: unknown): string {
  return JSON.stringify(data);
}

export interface SseHandlers<TEvent> {
  onEvent?: (event: TEvent) => void;
  onDone?: () => void;
}

export async function streamSse<TEvent>(
  path: string,
  body: unknown,
  handlers: SseHandlers<TEvent> = {}
): Promise<void> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload: ApiEnvelope<unknown> = await parseJson<unknown>(response).catch(
      () => ({})
    );
    throw new ApiClientError(
      payload.error || payload.message || "流式请求失败",
      response.status,
      payload.code,
      payload.details
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiClientError("无法读取响应流", response.status);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6).trim();
      if (data === "[DONE]") {
        handlers.onDone?.();
        return;
      }

      try {
        handlers.onEvent?.(JSON.parse(data) as TEvent);
      } catch {
        // Ignore malformed event frames from compatibility endpoints.
      }
    }
  }

  handlers.onDone?.();
}
