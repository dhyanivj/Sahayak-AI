import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Phone } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackCaregiverPhone?: string;
  caregiverName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sahayak UI Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 text-neutral-900"
        >
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-neutral-900">
                Don't worry, Sahayak is here.
              </h1>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Something paused in the display. Your notes and safety checks are saved.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="h-11 px-4 rounded-md bg-neutral-900 hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Sahayak</span>
              </button>

              {this.props.fallbackCaregiverPhone && (
                <a
                  href={`tel:${this.props.fallbackCaregiverPhone}`}
                  className="h-11 px-4 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-900 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call {this.props.caregiverName || 'Family'}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
