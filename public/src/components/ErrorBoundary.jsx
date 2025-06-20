import React from 'react';
import styled from 'styled-components';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
          </ErrorMessage>
          <RetryButton onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 200px;
  background: var(--background-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  color: var(--text-primary, #1f2937);
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  color: var(--text-secondary, #6b7280);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  max-width: 300px;
`;

const RetryButton = styled.button`
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--primary-hover, #2563eb);
  }
`;

export default ErrorBoundary;
