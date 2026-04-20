import type { BetaContentBlock, BetaMessage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { ToolResultBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { randomUUID } from 'crypto'
import type { AssistantMessage, UserMessage } from 'src/types/message.js'
import { findToolByName, type Tools } from '../../Tool.js'
import { type AgentId } from '../../types/ids.js'
import { normalizeToolInput, normalizeToolInputForAPI } from '../../utils/api.js'
import { safeParseJSON } from '../../utils/json.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const TOOL_CALL_MARKER = '[TOOL_CALLS]'

export function usesTextToolShim(model: string): boolean {
  return model.includes('mistralai/Mistral-Small-3.2-24B-Instruct-2506')
}

export const TEXT_TOOL_SHIM_SYSTEM_PROMPT = `When you need to use a tool, do not emit native tool-use blocks. Instead, respond with plain text only in this exact format:

[TOOL_CALLS]ToolName{"arg":"value"}

Rules:
- Output only the tool call text in that message.
- Do not wrap the tool call in markdown fences.
- If multiple tool calls are required, concatenate multiple [TOOL_CALLS] entries.
- After you receive tool results, answer normally unless you need another tool.`

function createTextToolUseId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 9)
}

export function parseTextToolCallsFromAPI(
  contentBlocks: BetaMessage['content'],
  tools: Tools,
  agentId?: AgentId,
): BetaMessage['content'] {
  if (contentBlocks.length !== 1 || contentBlocks[0]?.type !== 'text') {
    return contentBlocks
  }

  const text = contentBlocks[0].text.trim()
  if (!text.includes(TOOL_CALL_MARKER)) {
    return contentBlocks
  }

  const markers = [...text.matchAll(/\[TOOL_CALLS\]/g)].map(match => match.index)
  if (markers.length === 0 || markers.some(index => index === undefined)) {
    return contentBlocks
  }

  const parsedBlocks: BetaContentBlock[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i]!
    const end = markers[i + 1] ?? text.length
    let segment = text.slice(start + TOOL_CALL_MARKER.length, end).trim()
    while (segment.startsWith(TOOL_CALL_MARKER)) {
      segment = segment.slice(TOOL_CALL_MARKER.length).trim()
    }

    const jsonStart = segment.indexOf('{')
    if (jsonStart <= 0) {
      return contentBlocks
    }

    const toolName = segment.slice(0, jsonStart).trim()
    const rawInput = safeParseJSON(segment.slice(jsonStart).trim())
    if (!toolName || !rawInput || typeof rawInput !== 'object') {
      return contentBlocks
    }

    let normalizedInput = rawInput as { [key: string]: unknown }
    const tool = findToolByName(tools, toolName)
    if (tool) {
      normalizedInput = normalizeToolInput(tool, normalizedInput, agentId)
    }

    parsedBlocks.push({
      type: 'tool_use',
      id: createTextToolUseId(),
      name: toolName,
      input: normalizedInput,
    } satisfies ToolUseBlockParam)
  }

  return parsedBlocks.length > 0 ? parsedBlocks : contentBlocks
}

function stringifyToolResultContent(
  content: ToolResultBlockParam['content'],
): string {
  if (typeof content === 'string') {
    return content
  }

  return content
    .map(block => {
      if (typeof block === 'string') {
        return block
      }
      if ('text' in block && typeof block.text === 'string') {
        return block.text
      }
      return jsonStringify(block)
    })
    .join('\n')
}

export function convertMessagesToTextToolShim(
  messages: (UserMessage | AssistantMessage)[],
  tools: Tools,
): (UserMessage | AssistantMessage)[] {
  const toolUseNames = new Map<string, string>()

  return messages.map(message => {
    if (!Array.isArray(message.message.content)) {
      return message
    }

    if (message.type === 'assistant') {
      const parts = message.message.content.flatMap(block => {
        if (block.type === 'tool_use') {
          toolUseNames.set(block.id, block.name)
          const tool = findToolByName(tools, block.name)
          const input =
            tool && typeof block.input === 'object' && block.input !== null
              ? normalizeToolInputForAPI(
                  tool,
                  block.input as { [key: string]: unknown },
                )
              : block.input
          return `${TOOL_CALL_MARKER}${block.name}${jsonStringify(input)}`
        }
        if (block.type === 'text') {
          return block.text
        }
        return []
      })

      return {
        ...message,
        message: {
          ...message.message,
          content: [{ type: 'text', text: parts.join('\n').trim() }],
        },
      }
    }

    const parts = message.message.content.flatMap(block => {
      if (block.type === 'tool_result') {
        const toolName = toolUseNames.get(block.tool_use_id) ?? 'Tool'
        const prefix = block.is_error
          ? `Tool error for ${toolName}:`
          : `Tool result for ${toolName}:`
        return `${prefix}\n${stringifyToolResultContent(block.content)}`
      }
      if (block.type === 'text') {
        return block.text
      }
      return jsonStringify(block)
    })

    return {
      ...message,
      message: {
        ...message.message,
        content: [{ type: 'text', text: parts.join('\n').trim() }],
      },
    }
  })
}
