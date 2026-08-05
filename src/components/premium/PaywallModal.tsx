'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import {
  Lock,
  Check,
  Sparkles,
  Building2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Feature comparison rows ----------
const FEATURES: { label: string; free: boolean; pro: boolean; agency: boolean }[] = [
  { label: 'AI Smart Tools', free: false, pro: true, agency: true },
  { label: 'Save & load boards', free: false, pro: true, agency: true },
  { label: 'Upload images', free: false, pro: true, agency: true },
  { label: 'Download as PDF', free: false, pro: true, agency: true },
  { label: 'GeoGebra integration', free: false, pro: true, agency: true },
  { label: 'Mathpix handwriting', free: false, pro: true, agency: true },
  { label: 'Lesson recordings', free: false, pro: true, agency: true },
  { label: 'White-label branding', free: false, pro: false, agency: true },
  { label: 'Admin dashboard', free: false, pro: false, agency: true },
  { label: 'Unlimited smart credits', free: false, pro: false, agency: true },
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

  return (
    <Dialog open={paywallOpen} onOpenChange={(open) => !open && closePaywall()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="size-5 text-amber-500" />
            Upgrade required
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{paywallFeature}</span> is a premium
            feature. Upgrade your plan to unlock it.
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
              <span className="text-3xl font-extrabold">$15</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Perfect for individual tutors who want the full toolkit.
            </p>
            <Button
              className="mt-auto w-full"
              onClick={() => {
                // TODO: redirect to Stripe checkout for Pro
                window.open('/api/stripe/checkout?plan=pro', '_self');
              }}
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </Button>
          </div>

          {/* Agency */}
          <div
            className={cn(
              'relative rounded-xl border-2 p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg',
              'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
            )}
          >
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-amber-600" />
              <span className="text-lg font-bold">Agency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">$39</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              White-label branding, admin dashboard &amp; unlimited usage for tutoring centres.
            </p>
            <Button
              variant="outline"
              className="mt-auto w-full border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40"
              onClick={() => {
                // TODO: open contact form or redirect
                window.open('mailto:sales@superboard.com?subject=Agency%20Plan%20Inquiry', '_self');
              }}
            >
              <Building2 className="size-4" />
              Contact for Agency
            </Button>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="rounded-lg border overflow-hidden mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Feature</th>
                <th className="w-20 text-center px-3 py-2 font-medium">Free</th>
                <th className="w-20 text-center px-3 py-2 font-medium text-primary">Pro</th>
                <th className="w-20 text-center px-3 py-2 font-medium text-amber-600">Agency</th>
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
                    <CheckIcon on={f.agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
