'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  roomId: string | null;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WhiteboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Whiteboard] Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto px-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
              <Monitor className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Whiteboard Error</h2>
            <p className="text-muted-foreground leading-relaxed">
              The whiteboard encountered an unexpected error. Your work is safe — try refreshing.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="outline"
              >
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
