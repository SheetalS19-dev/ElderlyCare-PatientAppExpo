export interface ApiLogEntry {
  url: string;
  method?: string;
  status?: number | string;
  durationMs?: number;
  payload?: unknown;
  response?: unknown;
  error?: unknown;
  isError?: boolean;
}

const isDevMode = (): boolean =>
  typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

/**
 * Converts FormData (including React Native's `_parts`) and JSON strings into a plain
 * serializable value so DevTools Console renders request payloads clearly.
 */
export const serializeApiPayload = (payload: unknown): unknown => {
  if (payload === undefined || payload === null) {
    return undefined;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return payload;
      }
    }
    return payload;
  }

  const anyPayload = payload as any;
  const parts: Array<[string, unknown]> | null = Array.isArray(anyPayload?._parts)
    ? anyPayload._parts
    : typeof anyPayload?.entries === 'function'
      ? Array.from(anyPayload.entries())
      : null;

  if (parts) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of parts) {
      if (key in obj) {
        const existing = obj[key];
        obj[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }

  return payload;
};

/**
 * Formats an endpoint URL + optional query params into the final URL string for logs.
 */
export const formatApiUrl = (
  url: string,
  params?: Record<string, unknown>
): string => {
  if (!params || typeof params !== 'object') {
    return url;
  }

  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  if (entries.length === 0) {
    return url;
  }

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
};

/**
 * Prints structured API request/response logs to React Native DevTools Console in __DEV__.
 * Uses `console.log` so failed API calls don't trigger fullscreen LogBox red/yellow overlays.
 */
export const logApiCall = ({
  url,
  method = 'GET',
  status,
  durationMs,
  payload,
  response,
  error,
  isError = false,
}: ApiLogEntry): void => {
  if (!isDevMode()) {
    return;
  }

  const upperMethod = method.toUpperCase();
  const serializedPayload = serializeApiPayload(payload);
  const tag = isError ? '[API ❌]' : '[API ✅]';
  const durationLabel = typeof durationMs === 'number' ? ` [${durationMs}ms]` : '';

  console.log(`${tag} ${upperMethod} ${url} (${status ?? 'ERR'})${durationLabel}`, {
    url,
    method: upperMethod,
    status: status ?? null,
    ...(typeof durationMs === 'number' ? { durationMs } : {}),
    ...(serializedPayload !== undefined ? { payload: serializedPayload } : {}),
    ...(response !== undefined ? { response } : {}),
    ...(error !== undefined ? { error } : {}),
  });
};
