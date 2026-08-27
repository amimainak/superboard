'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/app-store';
import {
  Lock,
  Check,
  Sparkles,
  Zap,
  Crown,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Feature comparison rows ----------
const FEATURES: { label: string; free: boolean; pro: boolean; agencyStandard: boolean; agencyPremium: boolean }[] = [
  { label: 'Smart tools (quiz, graph, shapes)', free: true, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Advanced tools (lesson plans, rubrics)', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Save & load boards', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Upload images', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Download as PDF', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Graphing & geometry tools', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Handwriting recognition', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'Lesson recordings', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: '500 smart credits/month', free: false, pro: true, agencyStandard: true, agencyPremium: true },
  { label: 'White-label branding', free: false, pro: false, agencyStandard: true, agencyPremium: true },
  { label: 'Admin dashboard', free: false, pro: false, agencyStandard: true, agencyPremium: true },
  { label: 'Up to 5 sub-tutors', free: false, pro: false, agencyStandard: true, agencyPremium: true },
  { label: 'Unlimited sub-tutors', free: false, pro: false, agencyStandard: false, agencyPremium: true },
  { label: 'Priority support', free: false, pro: false, agencyStandard: false, agencyPremium: true },
];

function CheckIcon({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-emerald-500" />
  ) : (
    <span className="size-4 inline-block text-muted-foreground/40">&mdash;</span>
  );
}

// ---------- Component ----------
export default function PaywallModal() {
  const paywallOpen = useAppStore((s) => s.paywallOpen);
  const paywallFeature = useAppStore((s) => s.paywallFeature);
  const closePaywall = useAppStore((s) => s.closePaywall);
  const [tcAccepted, setTcAccepted] = useState(false);

  const handleCheckout = (plan: string) => {
    if (!tcAccepted) return;
    window.open(`/api/stripe/checkout?plan=${plan}`, '_self');
  };

  return (
    <Dialog open={paywallOpen} onOpenChange={(open) => { if (!open) { closePaywall(); setTcAccepted(false); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="size-5 text-amber-500" />
            Upgrade required
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{paywallFeature || 'This feature'}</span> requires an upgrade.
            {(paywallFeature?.includes('credit') || paywallFeature?.includes('Smart')) ? (
              <span className="text-muted-foreground"> Pro gives you 500 credits/month with access to all advanced tools.</span>
            ) : (
              <span className="text-muted-foreground"> Upgrade your plan to unlock this feature.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          {/* Pro */}
          <div
            className={cn(
              'relative rounded-xl border-2 p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg',
              'border-primary bg-primary/[0.03]',
            )}
          >
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              <span className="text-lg font-bold">Pro</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">$10</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              $96/year. Full toolkit for individual tutors.
            </p>
            <Button
              className="mt-auto w-full"
              disabled={!tcAccepted}
              onClick={() => handleCheckout('pro')}
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </Button>
          </div>

          {/* Agency Standard */}
          <div
            className={cn(
              'relative rounded-xl border-2 p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg',
              'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
            )}
          >
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-amber-600" />
              <span className="text-lg font-bold">Agency Standard</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">$39</span>
              <span className="text-sm text-muted-foreground">/month + $3/hr</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Up to 5 sub-tutors. $3/hr metered billing.
            </p>
            <Button
              variant="outline"
              className="mt-auto w-full border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40"
              disabled={!tcAccepted}
              onClick={() => handleCheckout('agency-standard')}
            >
              <Crown className="size-4" />
              Get Agency Standard
            </Button>
          </div>
        </div>

        {/* Agency Premium teaser */}
        <div className="rounded-xl border border-purple-200 p-3 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Agency Premium: $79/mo + $2/hr — Unlimited sub-tutors & volume discount</span>
          </div>
          <Button size="sm" variant="outline" className="border-purple-400 text-purple-700 text-xs" disabled={!tcAccepted} onClick={() => handleCheckout('agency-premium')}>
            Upgrade
          </Button>
        </div>

        {/* Feature comparison table */}
        <div className="rounded-lg border overflow-hidden mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Feature</th>
                <th className="w-16 text-center px-3 py-2 font-medium">Free</th>
                <th className="w-16 text-center px-3 py-2 font-medium text-primary">Pro</th>
                <th className="w-20 text-center px-3 py-2 font-medium text-amber-600">Std</th>
                <th className="w-20 text-center px-3 py-2 font-medium text-purple-600">Prem</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f.label}
                  className={cn(i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}
                >
                  <td className="px-3 py-1.5">{f.label}</td>
                  <td className="flex justify-center py-1.5">
                    <CheckIcon on={f.free} />
                  </td>
                  <td className="flex justify-center py-1.5">
                    <CheckIcon on={f.pro} />
                  </td>
                  <td className="flex justify-center py-1.5">
                    <CheckIcon on={f.agencyStandard} />
                  </td>
                  <td className="flex justify-center py-1.5">
                    <CheckIcon on={f.agencyPremium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* T&C Checkbox */}
        <div className="rounded-xl bg-muted/30 border p-3 mt-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={tcAccepted}
              onCheckedChange={(checked) => setTcAccepted(checked === true)}
              className="mt-0.5"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-emerald-600 hover:underline" target="_blank">Terms &amp; Conditions</Link>,{' '}
              <Link href="/privacy" className="text-emerald-600 hover:underline" target="_blank">Privacy Policy</Link>, and{' '}
              <Link href="/refund" className="text-emerald-600 hover:underline" target="_blank">Refund Policy</Link>.
              Payments are processed securely by Stripe.
            </span>
          </label>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={closePaywall}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
