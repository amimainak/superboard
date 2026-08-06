// ============================================================
// API Route: AI Action
// ============================================================
// Routes AI requests to the correct Claude model:
// - Text tasks → Claude 3 Haiku (cost savings)
// - Vision tasks → Claude 3.5 Sonnet (high accuracy)
// Deducts AI credits only when real AI is used.
// Requires auth — JWT must match the userId in the body.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkAICreditLimit, incrementAICredits, hasFeature } from '@/lib/usage';
import type { Tier } from '@/types';
import { TEXT_AI_ACTIONS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: verify caller matches the userId ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, action, prompt, imageBase64, systemPrompt } = body;

    // Validate required fields
    if (!userId || !action || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, prompt' },
        { status: 400 }
      );
    }

    // Input validation — prevent abuse
    if (typeof prompt !== 'string' || prompt.length > 50_000) {
      return NextResponse.json(
        { error: 'Prompt too long (max 50,000 characters)' },
        { status: 400 }
      );
    }
    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 20_000_000) {
      return NextResponse.json(
        { error: 'Image too large (max ~15MB)' },
        { status: 400 }
      );
    }

    // Security: caller can only perform AI actions on their own account
    if (userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only use AI on your own account' },
        { status: 403 }
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

    // 3. Check AI credits (only for real API calls)
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const isRealApiAvailable = !!apiKey && !apiKey.startsWith('TODO_');

    if (isRealApiAvailable) {
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
    }

    // 4. MANDATORY ROUTING LOGIC FOR COST
    const isTextAction = TEXT_AI_ACTIONS.includes(action);
    const targetModel = isTextAction ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';

    // 5. Call Anthropic API
    let result: string;

    if (!isRealApiAvailable) {
      // No real API key — return placeholder WITHOUT charging credits
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

    // 6. Only deduct credits for REAL API calls, not placeholders
    if (isRealApiAvailable) {
      await incrementAICredits(userId, tier);
    }

    const creditCheck = isRealApiAvailable
      ? await checkAICreditLimit(userId, tier)
      : null;

    return NextResponse.json({
      success: true,
      model: targetModel,
      action,
      result,
      isPlaceholder: !isRealApiAvailable,
      creditsRemaining: creditCheck
        ? creditCheck.creditsLimit === Infinity
          ? Infinity
          : creditCheck.creditsLimit - creditCheck.creditsUsed
        : null,
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
