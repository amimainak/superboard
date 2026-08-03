// ============================================================
// Anthropic AI Client (Claude 3 Haiku + Claude 3.5 Sonnet)
// ============================================================
// CRITICAL: Routes to different models based on action type.
// - Text tasks (Quiz, Worksheet, Summary) → Claude 3 Haiku
// - Vision tasks (Graphing, Shape Perfection) → Claude 3.5 Sonnet
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { AIAction } from '@/types';
import { TEXT_AI_ACTIONS } from '@/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Model identifiers as specified in the blueprint
const CLAUDE_HAIKU = 'claude-3-haiku-20240307';
const CLAUDE_SONNET = 'claude-3-5-sonnet-20241022';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'TODO_ANTHROPIC_API_KEY') {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Please set it in .env.local'
      );
    }
    anthropicClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

/**
 * Determines which Claude model to use based on the action type.
 * MANDATORY ROUTING LOGIC for cost optimization.
 */
export function getModelForAction(action: AIAction): string {
  if (TEXT_AI_ACTIONS.includes(action)) {
    return CLAUDE_HAIKU; // 10x cost savings for text tasks
  }
  return CLAUDE_SONNET; // High accuracy for vision tasks
}

/**
 * Send a text-only prompt to Claude.
 * Used for Quiz generation, Worksheets, Summaries, Grammar, etc.
 */
export async function callTextAI(params: {
  action: AIAction;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const client = getClient();
  const model = getModelForAction(params.action);

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens || 4096,
    temperature: params.temperature || 0.3,
    system: params.systemPrompt || 'You are a helpful K-12 educational assistant. Help the teacher create high-quality educational content. Do NOT give the student the final answer directly.',
    messages: [
      {
        role: 'user',
        content: params.prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return textBlock.text;
}

/**
 * Send a vision (image + text) prompt to Claude 3.5 Sonnet.
 * Used for Graphing, Shape Perfection, Handwriting-to-Math, etc.
 *
 * CRITICAL: The image MUST be pre-compressed by the frontend
 * ImageCompressor before being sent here.
 */
export async function callVisionAI(params: {
  action: AIAction;
  prompt: string;
  imageBase64: string; // Already compressed JPEG
  mediaType?: string;
  systemPrompt?: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const model = getModelForAction(params.action);

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens || 4096,
    system:
      params.systemPrompt ||
      'You are a K-12 educational AI specialized in visual analysis. Analyze the image and provide precise mathematical/visual output. The teacher needs this for their lesson.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (params.mediaType || 'image/jpeg') as 'image/jpeg',
              data: params.imageBase64,
            },
          },
          {
            type: 'text',
            text: params.prompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from AI');
  }

  return textBlock.text;
}

export { CLAUDE_HAIKU, CLAUDE_SONNET };
