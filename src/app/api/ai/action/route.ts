// ============================================================
// API Route: AI Action
// ============================================================
// Routes AI requests to the correct Claude model:
// - Text tasks → Claude 3 Haiku (cost savings)
// - Vision tasks → Claude 3.5 Sonnet (high accuracy)
// Deducts AI credits after successful completion.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAICreditLimit, incrementAICredits, hasFeature } from '@/lib/usage';
import type { AIAction, Tier } from '@/types';
import { TEXT_AI_ACTIONS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, prompt, imageBase64, systemPrompt } = body;

    // Validate required fields
    if (!userId || !action || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, prompt' },
        { status: 400 }
      );
    }

    // 1. Verify auth & tier
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = user.tier as Tier;

    // 2. Check feature access
    if (!hasFeature(tier, 'aiTools')) {
      return NextResponse.json(
        { error: 'FEATURE_LOCKED', message: 'AI tools require Pro or Agency tier' },
        { status: 403 }
      );
    }

    // 3. Check AI credits
    const creditCheck = await checkAICreditLimit(userId, tier);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          message: 'AI credits exhausted for this period.',
          creditsUsed: creditCheck.creditsUsed,
          creditsLimit: creditCheck.creditsLimit,
        },
        { status: 403 }
      );
    }

    // 4. MANDATORY ROUTING LOGIC FOR COST
    const isTextAction = TEXT_AI_ACTIONS.includes(action);
    const targetModel = isTextAction ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';

    // 5. Call Anthropic API
    let result: string;
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!apiKey || apiKey.startsWith('TODO_')) {
      // TODO: When Anthropic API key is configured, replace this with actual API call
      // Import and use { callTextAI } or { callVisionAI } from '@/lib/ai'
      result = generatePlaceholderResponse(action, prompt);
    } else {
      // TODO: Actual Anthropic API integration
      // if (isTextAction) {
      //   result = await callTextAI({ action, prompt, systemPrompt });
      // } else {
      //   if (!imageBase64) {
      //     return NextResponse.json({ error: 'Image required for vision action' }, { status: 400 });
      //   }
      //   result = await callVisionAI({ action, prompt, imageBase64, systemPrompt });
      // }
      result = generatePlaceholderResponse(action, prompt);
    }

    // 6. Upon success, increment aiCreditsUsed by 1
    await incrementAICredits(userId, tier);

    return NextResponse.json({
      success: true,
      model: targetModel,
      action,
      result,
      creditsRemaining:
        creditCheck.creditsLimit === Infinity
          ? Infinity
          : creditCheck.creditsLimit - creditCheck.creditsUsed - 1,
    });
  } catch (error) {
    console.error('[AI Action] Error:', error);
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Generates placeholder responses for development.
 * TODO: Remove when Anthropic API key is configured.
 */
function generatePlaceholderResponse(action: string, prompt: string): string {
  return JSON.stringify({
    status: 'placeholder',
    message: 'Anthropic API not yet configured. Replace TODO_ANTHROPIC_API_KEY in .env.local',
    action,
    promptPreview: prompt.substring(0, 100),
  });
}
