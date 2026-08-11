// ============================================================
// Billing Panel
// ============================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Tier } from '@/types';
import { isAgencyTier } from '@/types';
import { PRICING, CREDIT_PACKS } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { authFetch } from '@/lib/auth-fetch';
import { Crown, Star, Zap, TrendingUp, Check, Palette, Building2, Shield, ExternalLink, Save, Loader2, Gift, Copy, Package, Clock, DollarSign } from 'lucide-react';

function getTierLabel(tier: Tier): string {
  if (tier === 'AGENCY_STANDARD') return 'Agency Standard';
  if (tier === 'AGENCY_PREMIUM') return 'Agency Premium';
  if (tier === 'AGENCY') return 'Agency';
  if (tier === 'PRO') return 'Pro';
  return 'Free';
}

function getTierColor(tier: Tier): string {
  if (tier === 'AGENCY_PREMIUM') return 'bg-purple-100 text-purple-800';
  if (tier === 'AGENCY_STANDARD' || tier === 'AGENCY') return 'bg-amber-100 text-amber-800';
  if (tier === 'PRO') return 'bg-emerald-100 text-emerald-800';
  return 'bg-teal-50 text-teal-700';
}

function getTierDescription(tier: Tier): string {
  if (tier === 'AGENCY_PREMIUM') return 'Agency Premium — $79/month + $2/hr';
  if (tier === 'AGENCY_STANDARD') return 'Agency Standard — $39/month + $3/hr';
  if (tier === 'AGENCY') return 'Agency — $39/month + per hour';
  if (tier === 'PRO') return 'Pro Tutor — $10/month';
  return 'Free tier — Limited features';
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function BillingPanel({ tier, brandColor, setBrandColor, onSaveBrandColor }: { tier: Tier; brandColor: string; setBrandColor: (c: string) => void; onSaveBrandColor?: () => Promise<void> }) {
  const tierLabel = getTierLabel(tier);
  const tierColor = getTierColor(tier);
  const tierDesc = getTierDescription(tier);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [referralData, setReferralData] = useState<{ referralCode: string; referralCount: number; rewardClaimed: boolean; referralLink: string } | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Fetch referral data on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/referral');
        if (res.ok) {
          const data = await res.json();
          setReferralData(data);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handleCopyReferralLink = useCallback(() => {
    if (!referralData?.referralLink) return;
    navigator.clipboard.writeText(referralData.referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  }, [referralData?.referralLink]);

  const handleClaimReward = useCallback(async () => {
    setClaimingReward(true);
    try {
      await authFetch('/api/referral/claim', { method: 'POST' });
      setReferralData((prev) => prev ? { ...prev, rewardClaimed: true } : prev);
    } catch { /* ignore */ }
    setClaimingReward(false);
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgradingPlan(plan);
    try {
      window.open(`/api/stripe/checkout?plan=${plan}`, '_self');
    } catch {
      setUpgradingPlan(null);
    }
  };

  const handleColorChange = (value: string) => {
    if (value === '') {
      setColorError(null);
      setBrandColor(value);
      return;
    }
    if (!HEX_COLOR_REGEX.test(value)) {
      setColorError('Invalid hex color. Use format: #RRGGBB');
    } else {
      setColorError(null);
    }
    setBrandColor(value);
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Billing &amp; Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              {tier === 'AGENCY_PREMIUM' ? <Shield className="w-5 h-5 text-white" /> : tier === 'AGENCY_STANDARD' || tier === 'AGENCY' ? <Crown className="w-5 h-5 text-white" /> : tier === 'PRO' ? <Star className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-semibold">Current Plan</p>
              <p className="text-sm text-muted-foreground">{tierDesc}</p>
            </div>
          </div>
          <Badge className={`rounded-full px-3 font-semibold ${tierColor}`}>{tierLabel}</Badge>
        </div>

        {/* Upgrade Options — only show for non-agency tiers */}
        {!isAgencyTier(tier) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Upgrade Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pro — only for FREE users */}
                {tier === 'FREE' && (
                  <Card className="rounded-2xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-3 right-3"><Badge className="bg-emerald-500 text-white rounded-full text-[10px]">Popular</Badge></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Star className="w-4 h-4 text-emerald-600" /></div>Pro Tutor</CardTitle>
                      <CardDescription className="text-base font-semibold text-foreground">$10/month or $96/year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 mb-4">
                        {['Unlimited video calls', '500 smart credits/month', 'GeoGebra & Mathpix', 'Save/Load & Templates', '2 recordings/month'].map((f) => (
                          <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></div>{f}</li>
                        ))}
                      </ul>
                      <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20" onClick={() => handleUpgrade('pro')} disabled={!!upgradingPlan}>{upgradingPlan === 'pro' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecting…</> : 'Upgrade to Pro'}</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Agency Standard — only for PRO users */}
                {tier === 'PRO' && (
                  <Card className="rounded-2xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-3 right-3"><Badge className="bg-amber-500 text-white rounded-full text-[10px]">Best Value</Badge></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Crown className="w-4 h-4 text-amber-600" /></div>Agency Standard</CardTitle>
                      <CardDescription className="text-base font-semibold text-foreground">$39/month + $3/hr</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 mb-4">
                        {['Everything in Pro', '$39/mo base fee', 'Up to 5 sub-tutors', 'White-label branding', 'Unlimited recordings', 'Admin dashboard'].map((f) => (
                          <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-amber-600" /></div>{f}</li>
                        ))}
                      </ul>
                      <Button className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-500/20" onClick={() => handleUpgrade('agency-standard')} disabled={!!upgradingPlan}>{upgradingPlan === 'agency-standard' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecting…</> : 'Get Agency Standard'}</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Agency Premium — only for PRO users */}
                {tier === 'PRO' && (
                  <Card className="rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-3 right-3"><Badge className="bg-purple-500 text-white rounded-full text-[10px]">Scale</Badge></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Shield className="w-4 h-4 text-purple-600" /></div>Agency Premium</CardTitle>
                      <CardDescription className="text-base font-semibold text-foreground">$79/month + $2/hr</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 mb-4">
                        {['Everything in Standard', '$79/mo base fee', 'Unlimited sub-tutors', '$2/hr (volume discount)', 'Priority support', 'Advanced analytics (Coming Soon)'].map((f) => (
                          <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-purple-600" /></div>{f}</li>
                        ))}
                      </ul>
                      <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md shadow-purple-500/20" onClick={() => handleUpgrade('agency-premium')} disabled={!!upgradingPlan}>{upgradingPlan === 'agency-premium' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecting…</> : 'Get Agency Premium'}</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* Agency Upsell — if on Standard, show Premium upgrade */}
        {tier === 'AGENCY_STANDARD' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-purple-500" />Upgrade to Agency Premium</h3>
              <div className="rounded-xl border-2 border-purple-200 p-4 bg-purple-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-purple-900">Need unlimited sub-tutors or lower hourly rates?</p>
                    <p className="text-sm text-purple-700">Upgrade to Agency Premium for unlimited sub-tutors and $2/hr instead of $3/hr. The crossover point is just 40 hours/month.</p>
                  </div>
                  <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex-shrink-0" onClick={() => handleUpgrade('agency-premium')} disabled={!!upgradingPlan}>{upgradingPlan === 'agency-premium' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}</Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* White-Label Settings — for any agency tier */}
        {isAgencyTier(tier) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-emerald-500" />White-Label Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: brandColor || '#000' }} />
                    <div className="flex-1 space-y-1">
                      <Input value={brandColor || ''} onChange={(e) => handleColorChange(e.target.value)} placeholder="#FF5733" className="flex-1 rounded-xl" />
                      {colorError && <p className="text-xs text-destructive">{colorError}</p>}
                    </div>
                    {onSaveBrandColor && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1 flex-shrink-0" onClick={onSaveBrandColor} disabled={!!colorError}>
                        <Save className="w-3 h-3" />Save
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Applied to new lessons automatically.</p>
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <Input placeholder="classroom.yourcenter.com" disabled className="rounded-xl bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Custom domains require DNS configuration.{' '}
                    <a href="mailto:sales@superboard.live" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />Contact Sales to enable
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Refer a Friend — for non-agency tiers */}
        {!isAgencyTier(tier) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Gift className="w-4 h-4 text-emerald-500" />Refer a Friend</h3>
              <div className="rounded-xl border border-emerald-200 p-4 bg-gradient-to-br from-emerald-50/80 to-sky-50/80 space-y-3">
                <p className="text-sm text-muted-foreground">Give 1 month of Pro, get 1 month of Pro. When your referral upgrades, you both get a free month.</p>
                {referralData ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={referralData.referralLink}
                        className="flex-1 rounded-xl bg-white text-sm font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl gap-1.5 flex-shrink-0"
                        onClick={handleCopyReferralLink}
                      >
                        {copiedReferral ? <><Check className="w-3.5 h-3.5 text-emerald-600" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">You've referred {referralData.referralCount} tutor{referralData.referralCount !== 1 ? 's' : ''}</p>
                    {referralData.rewardClaimed ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <Check className="w-4 h-4" />
                        Reward claimed — 1 free month of Pro
                      </div>
                    ) : referralData.referralCount >= 1 ? (
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={handleClaimReward}
                        disabled={claimingReward}
                      >
                        {claimingReward ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Claiming…</> : 'Claim your free month of Pro'}
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading referral info…
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Credit Packs — for agency tiers */}
        {isAgencyTier(tier) && (
          <>
            <Separator />
            <CreditPackSection agencyId={undefined} />
          </>
        )}

        {/* Legal Notice */}
        <Separator />
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          By upgrading, you agree to our{' '}
          <Link href="/terms" className="text-emerald-600 hover:underline" target="_blank">Terms &amp; Conditions</Link>,{' '}
          <Link href="/privacy" className="text-emerald-600 hover:underline" target="_blank">Privacy Policy</Link>, and{' '}
          <Link href="/refund" className="text-emerald-600 hover:underline" target="_blank">Refund Policy</Link>.
          Payments processed securely via Stripe.
        </p>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// Credit Pack Section — Prepaid Hourly Packs for Agencies
// ------------------------------------------------------------------

function CreditPackSection({ agencyId }: { agencyId: string | undefined }) {
  const [packs, setPacks] = useState<Array<{ id: string; hoursPurchased: number; hoursRemaining: number; pricePaidCents: number; status: string; createdAt: string }>>([]);
  const [totalHoursRemaining, setTotalHoursRemaining] = useState(0);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/agency/credit-packs');
        if (res.ok) {
          const data = await res.json();
          setPacks(data.packs || []);
          setTotalHoursRemaining(data.totalHoursRemaining || 0);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handlePurchase = async (hours: number) => {
    setPurchasing(hours);
    try {
      const res = await authFetch('/api/agency/credit-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh packs
        const refreshRes = await authFetch('/api/agency/credit-packs');
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setPacks(refreshData.packs || []);
          setTotalHoursRemaining(refreshData.totalHoursRemaining || 0);
        }
      }
    } catch { /* ignore */ }
    setPurchasing(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-amber-500" />Prepaid Credit Packs</h3>
      <p className="text-sm text-muted-foreground">Buy prepaid hours at a discounted rate to manage costs. Hours are deducted as lessons run.</p>

      {/* Balance summary */}
      {!loading && (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">Available Prepaid Hours</p>
            <p className="text-lg font-bold text-amber-700">{totalHoursRemaining.toFixed(1)} hours remaining</p>
          </div>
        </div>
      )}

      {/* Pack purchase options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.hours} className="rounded-xl border border-gray-200 p-4 hover:border-amber-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{pack.label}</p>
                <p className="text-xs text-muted-foreground">{pack.rateLabel} — save on hourly rate</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-medium">${(pack.priceCents / 100).toFixed(0)}</Badge>
            </div>
            <Button
              size="sm"
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              onClick={() => handlePurchase(pack.hours)}
              disabled={!!purchasing}
            >
              {purchasing === pack.hours ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Processing…</> : <><DollarSign className="w-3 h-3 mr-1" />Buy {pack.label}</>}
            </Button>
          </div>
        ))}
      </div>

      {/* Recent packs */}
      {packs.length > 0 && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-xs">Purchased</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Hours</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Remaining</th>
                <th className="text-right px-4 py-2 font-medium text-xs">Paid</th>
              </tr>
            </thead>
            <tbody>
              {packs.slice(0, 5).map((pack) => (
                <tr key={pack.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(pack.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-xs text-right">{pack.hoursPurchased}</td>
                  <td className="px-4 py-2 text-xs text-right font-medium">{pack.hoursRemaining.toFixed(1)}</td>
                  <td className="px-4 py-2 text-xs text-right">${(pack.pricePaidCents / 100).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
