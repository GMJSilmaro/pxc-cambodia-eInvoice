"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/caminv');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors -ml-2 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Back to Dashboard'}
    </button>
  );
}
