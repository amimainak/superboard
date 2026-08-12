// ============================================================
// ErrorBoundary — Catches render errors to prevent white-screens
// ============================================================
// Wraps the application to catch runtime errors in React
// component trees. Displays a friendly error message instead
// of crashing the entire app.
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback UI to show instead of the default error display */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  private retryCount = 0;

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging (in production, send to error tracking service)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a hydration mismatch error — auto-retry once
      const isHydrationError = this.state.error?.message?.includes('#321')
        || this.state.error?.message?.includes('hydration')
        || this.state.error?.message?.includes('Minified React error');

      if (isHydrationError && this.retryCount === 0) {
        this.retryCount = 1;
        // Use key to force React to unmount and remount children from scratch
        // This bypasses hydration because the new tree starts as a fresh client render
        return (
          <HydrationRetryWrapper>
            {this.props.children}
          </HydrationRetryWrapper>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="text-center max-w-md space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              An unexpected error occurred. This has been logged for review.
              Please try again or refresh the page.
            </p>
            <Button
              onClick={this.handleReset}
              className="rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hydration retry wrapper — forces a completely fresh client-side mount
// by using a key change in useEffect. The children are rendered inside a
// component that only renders after mount (useEffect), so React treats
// the subtree as a new client-only tree.
function HydrationRetryWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    // Trigger a re-render with a new key after initial mount
    setRetryKey(prev => prev + 1);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Render nothing during initial hydration
  }

  // Use key to force React to create a fresh component tree
  return <React.Fragment key={retryKey}>{children}</React.Fragment>;
}
