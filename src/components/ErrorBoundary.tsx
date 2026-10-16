import React from "react";
import { useTranslation } from "react-i18next";

function ErrorMessage() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-sm font-medium text-red-800 mb-2">{t("errors.title")}</h3>
      <p className="text-xs text-red-600">{t("errors.generic")}</p>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
  componentName?: string;
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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName || "component"}:`, error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ? this.props.fallback(this.state.error) : <ErrorMessage />;
    }

    return this.props.children;
  }
}
