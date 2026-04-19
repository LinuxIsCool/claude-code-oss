export type ConnectorTextDelta = {
  type: 'connector_text_delta'
  text?: string
}

export type ConnectorTextBlock = {
  type: 'connector_text'
  text?: string
  id?: string
}

export function isConnectorTextBlock(
  value: unknown,
): value is ConnectorTextBlock {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: string }).type === 'connector_text'
  )
}
