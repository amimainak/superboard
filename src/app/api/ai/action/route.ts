// ============================================================
// API Route: AI Action
// ============================================================
// Routes AI requests to the correct Claude model:
// - Text tasks → Claude 3 Haiku (cost savings)
// - Vision tasks → Claude 3.5 Sonnet (high accuracy)
// Deducts AI credits based on CREDIT_COSTS map (variable pricing).
// Enhanced actions (lesson plans, rubrics, etc.) are Pro+ only.
// Requires auth — JWT must match the userId in the body.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkAICreditLimit, incrementAICredits, hasFeature } from '@/lib/usage';
import { aiActionSchema, validateInput } from '@/lib/validations';
import type { Tier, AIAction } from '@/types';
import { TEXT_AI_ACTIONS, VISION_AI_ACTIONS, CREDIT_COSTS, ENHANCED_ACTION_SET } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // --- Rate limit check ---
    const rateLimitResult = await checkRateLimit(request, 'ai');
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } });
    }

    // --- Auth check: verify caller matches the userId ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{ userId: string; action: string; prompt: string; imageBase64?: string; systemPrompt?: string }>(aiActionSchema, body);
    if (!parsed.success) return parsed.response;
    const { userId, action, prompt, imageBase64, systemPrompt } = parsed.data;

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

    // 2. Check basic feature access (aiTools flag)
    if (!hasFeature(tier, 'aiTools')) {
      return NextResponse.json(
        { error: 'FEATURE_LOCKED', message: 'Smart tools require Pro or Agency tier' },
        { status: 403 }
      );
    }

    // 3. Block enhanced actions for FREE tier (they get the 14 original actions only)
    if (tier === 'FREE' && ENHANCED_ACTION_SET.has(action as AIAction)) {
      return NextResponse.json(
        {
          error: 'UPGRADE_REQUIRED',
          message: 'This advanced feature requires Pro. Upgrade to unlock lesson plans, rubrics, flashcards, and more.',
          feature: action,
        },
        { status: 403 }
      );
    }

    // 4. Get credit cost for this action
    const creditCost = CREDIT_COSTS[action as AIAction] ?? 1;

    // 5. Check AI credits (only for real API calls)
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const isRealApiAvailable = !!apiKey && !apiKey.startsWith('TODO_');

    if (isRealApiAvailable) {
      const creditCheck = await checkAICreditLimit(userId, tier);
      if (!creditCheck.allowed) {
        return NextResponse.json(
          {
            error: 'LIMIT_REACHED',
            message: 'Smart credits exhausted for this period. Upgrade for more credits.',
            creditsUsed: creditCheck.creditsUsed,
            creditsLimit: creditCheck.creditsLimit,
            creditCost,
          },
          { status: 403 }
        );
      }

      // Check if user has enough credits for THIS specific action
      const remaining = creditCheck.creditsLimit === Infinity
        ? Infinity
        : creditCheck.creditsLimit - creditCheck.creditsUsed;
      if (remaining !== Infinity && remaining < creditCost) {
        return NextResponse.json(
          {
            error: 'INSUFFICIENT_CREDITS',
            message: `This action costs ${creditCost} credit${creditCost > 1 ? 's' : ''}. You have ${remaining} remaining. Upgrade for more credits.`,
            creditsUsed: creditCheck.creditsUsed,
            creditsLimit: creditCheck.creditsLimit,
            creditCost,
            remaining,
          },
          { status: 403 }
        );
      }
    }

    // 6. MANDATORY ROUTING LOGIC FOR COST
    const isTextAction = TEXT_AI_ACTIONS.includes(action as AIAction);
    const isVisionAction = VISION_AI_ACTIONS.includes(action as AIAction);
    const targetModel = isTextAction ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';

    // Estimate AI cost in cents based on action type
    // Text (Haiku): ~$0.0003 per credit → 0.03 cents per credit
    // Vision (Sonnet): ~$0.015 per credit → 1.5 cents per credit
    const costCents = isVisionAction
      ? Math.ceil(creditCost * 1.5)
      : Math.ceil(creditCost * 0.03);

    // 7. Call Anthropic API
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

    // 8. Deduct credits and track AI cost (only for real API calls)
    let softThrottle = false;
    if (isRealApiAvailable) {
      await incrementAICredits(userId, tier, creditCost, costCents);

      // Check soft throttle: Pro users exceeding $3.00/month AI cost
      const postCheck = await checkAICreditLimit(userId, tier);
      if (tier === 'PRO' && postCheck.aiCostCents > 300) {
        softThrottle = true;
      }
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
      creditCost,
      creditsRemaining: creditCheck
        ? creditCheck.creditsLimit === Infinity
          ? Infinity
          : creditCheck.creditsLimit - creditCheck.creditsUsed
        : null,
      softThrottle,
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
