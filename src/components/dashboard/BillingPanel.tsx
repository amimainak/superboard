// ============================================================
// Billing Panel
// ============================================================
'use client';

import React from 'react';
import type { Tier } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Star, Zap, TrendingUp, Check, Palette } from 'lucide-react';

export function BillingPanel({ tier, brandColor, setBrandColor }: { tier: Tier; brandColor: string; setBrandColor: (c: string) => void }) {
  const tierLabel = tier === 'AGENCY' ? 'Agency' : tier === 'PRO' ? 'Pro' : 'Free';
  const tierColor = tier === 'AGENCY' ? 'bg-amber-100 text-amber-800' : tier === 'PRO' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700';

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Billing &amp; Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              {tier === 'AGENCY' ? <Crown className="w-5 h-5 text-white" /> : tier === 'PRO' ? <Star className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-semibold">Current Plan</p>
              <p className="text-sm text-muted-foreground">{tier === 'FREE' && 'Free tier \u2014 Limited features'}{tier === 'PRO' && 'Pro Tutor \u2014 $10/month'}{tier === 'AGENCY' && 'Agency \u2014 $39/month + per student'}</p>
            </div>
          </div>
          <Badge className={`rounded-full px-3 font-semibold ${tierColor}`}>{tierLabel}</Badge>
        </div>

        {tier !== 'AGENCY' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Upgrade Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20">Upgrade to Pro</Button>
                    </CardContent>
                  </Card>
                )}
                <Card className="rounded-2xl border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-3 right-3"><Badge className="bg-amber-500 text-white rounded-full text-[10px]">Best Value</Badge></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Crown className="w-4 h-4 text-amber-600" /></div>Agency / Center</CardTitle>
                    <CardDescription className="text-base font-semibold text-foreground">$39/month + per student</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 mb-4">
                      {['Everything in Pro', '$39/mo base fee', 'White-labeling & branding', 'Custom domains', 'Unlimited recordings', 'Admin dashboard & analytics'].map((f) => (
                        <li key={f} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-amber-600" /></div>{f}</li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold">Contact Sales</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {tier === 'AGENCY' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-emerald-500" />White-Label Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border shadow-sm" style={{ backgroundColor: brandColor || '#000' }} />
                    <Input value={brandColor || ''} onChange={(e) => setBrandColor(e.target.value)} placeholder="#FF5733" className="flex-1 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <Input placeholder="classroom.yourcenter.com" disabled className="rounded-xl" />
                  <p className="text-xs text-muted-foreground">Configure via DNS settings</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
