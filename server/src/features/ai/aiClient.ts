import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';

/**
 * Thin wrapper over the Anthropic Messages API. The client is only constructed
 * when ANTHROPIC_API_KEY is present, so AI endpoints can degrade to a
 * deterministic rules-based fallback when no key is configured.
 */
const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export const aiEnabled = client !== null;

/** Sends a single prompt and returns the concatenated text of the response. */
export async function complete(system: string, prompt: string): Promise<string> {
  if (!client) throw new Error('AI is not configured');
  const message = await client.messages.create({
    model: env.AI_MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();
}
