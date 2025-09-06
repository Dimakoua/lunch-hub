import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-dark-primary mb-3" />
      <p className="text-gray-600 dark:text-dark-text-secondary font-medium">{message}</p>
    </div>
  );
};