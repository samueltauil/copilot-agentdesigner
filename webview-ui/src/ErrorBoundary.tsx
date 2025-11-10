import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

declare const acquireVsCodeApi: any;

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Webview] [${Date.now()}] React Error Boundary caught error:`, error);
    console.error(`[Webview] [${Date.now()}] Component stack:`, errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Send error to extension for logging
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        type: 'webviewError',
        error: {
          message: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack
        }
      });
    } catch (e) {
      console.error('[Webview] Failed to send error to extension:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: 'var(--vscode-errorForeground)',
          backgroundColor: 'var(--vscode-editor-background)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--vscode-font-family)'
        }}>
          <h2 style={{ marginBottom: '20px' }}>⚠️ Agent Designer Error</h2>
          <p style={{ marginBottom: '10px', maxWidth: '600px', textAlign: 'center' }}>
            An error occurred while rendering the canvas. This has been logged for debugging.
          </p>
          <details style={{ 
            marginTop: '20px',
            padding: '10px',
            backgroundColor: 'var(--vscode-editor-background)',
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: '4px',
            maxWidth: '800px',
            width: '100%'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
              Error Details
            </summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
              {'\n\nComponent Stack:'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => {
              try {
                const vscode = acquireVsCodeApi();
                vscode.postMessage({ type: 'getState' });
                this.setState({ hasError: false, error: null, errorInfo: null });
              } catch (e) {
                console.error('[Webview] Failed to reload:', e);
                window.location.reload();
              }
            }}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reload Canvas
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
