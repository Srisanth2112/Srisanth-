import React from 'react';

interface LoadingSpinnerProps {
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "w-6 h-6" }) => {
  return (
    <div className={`animate-spin rounded-full border-2 border-zinc-500/50 border-t-blue-500 ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};