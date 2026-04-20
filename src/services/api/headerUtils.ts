type HeaderValue = string | string[] | undefined

type HeaderRecord = Record<string, HeaderValue>

export function getHeader(
  headers: globalThis.Headers | HeaderRecord | undefined,
  name: string,
): string | null {
  if (!headers) {
    return null
  }

  if (typeof (headers as globalThis.Headers).get === 'function') {
    return (headers as globalThis.Headers).get(name)
  }

  const record = headers as HeaderRecord
  const direct = record[name] ?? record[name.toLowerCase()]
  if (Array.isArray(direct)) {
    return direct[0] ?? null
  }
  return direct ?? null
}

export function toHeaders(
  headers: globalThis.Headers | HeaderRecord | undefined,
): globalThis.Headers {
  if (!headers) {
    return new globalThis.Headers()
  }

  if (typeof (headers as globalThis.Headers).get === 'function') {
    return headers as globalThis.Headers
  }

  const normalized: [string, string][] = []
  for (const [key, value] of Object.entries(headers as HeaderRecord)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        normalized.push([key, entry])
      }
      continue
    }
    if (value !== undefined) {
      normalized.push([key, value])
    }
  }

  return new globalThis.Headers(normalized)
}
