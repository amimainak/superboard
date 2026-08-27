// ============================================================
// ErrorBoundary — Catches render errors to prevent white-screens
// ============================================================
// Wraps the application to catch runtime errors in React
// component trees. Displays a friendly error message instead
// of crashing the entire app.
// ============================================================

'use client';

import React from 'react';
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
  // Track whether we've seen a hydration error to avoid infinite loops
  private hydrationErrorSeen = false;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // For hydration mismatches, don't set error state — let React patch the DOM.
    // We can't do full regex matching in static method, but we check what we can.
    if (error.message?.includes('#321') || error.message?.includes('Minified React error')) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isHydrationError = error.message?.includes('#321')
      || error.message?.includes('hydration')
      || error.message?.includes('Minified React error')
      || error.message?.includes('Hydration');

    if (isHydrationError && !this.hydrationErrorSeen) {
      // Only log once to avoid console spam
      this.hydrationErrorSeen = true;
      console.warn('[ErrorBoundary] Suppressing hydration mismatch — React will patch DOM automatically');
      return;
    }

    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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
