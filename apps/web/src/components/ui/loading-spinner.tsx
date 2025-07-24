'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'ripple';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className,
  text 
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-brand-600 rounded-full animate-dots"></div>
          <div className="w-2 h-2 bg-brand-600 rounded-full animate-dots" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-brand-600 rounded-full animate-dots" style={{animationDelay: '0.2s'}}></div>
        </div>
        {text && (
          <p className={cn("mt-3 text-brand-600 font-medium animate-pulse", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className={cn("bg-brand-600 rounded-full animate-pulse", sizeClasses[size])}></div>
        {text && (
          <p className={cn("mt-3 text-brand-600 font-medium animate-pulse", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'ripple') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className="relative w-18 h-18">
          <div className="absolute border-4 border-brand-600 opacity-75 rounded-full animate-ripple"></div>
          <div className="absolute border-4 border-brand-600 opacity-75 rounded-full animate-ripple" style={{animationDelay: '0.5s'}}></div>
        </div>
        {text && (
          <p className={cn("mt-3 text-brand-600 font-medium", textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin", sizeClasses[size])}></div>
      {text && (
        <p className={cn("mt-3 text-brand-600 font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Full page loading overlay
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'ripple';
}

export function LoadingOverlay({ isVisible, text = "Loading...", variant = 'default' }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-8 animate-scale-in">
        <LoadingSpinner size="xl" variant={variant} text={text} />
      </div>
    </div>
  );
}

// Inline loading state for content areas
interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'default' | 'dots' | 'pulse' | 'ripple';
  text?: string;
}

export function LoadingState({ 
  isLoading, 
  children, 
  fallback, 
  variant = 'dots',
  text = "Loading..."
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        {fallback || <LoadingSpinner size="lg" variant={variant} text={text} />}
      </div>
    );
  }

  return <>{children}</>;
}