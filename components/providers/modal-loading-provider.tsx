'use client';

import React, { createContext, useContext } from 'react';
import { ModalLoading, ModalLoadingState, useModalLoading } from '@/components/ui/modal-loading';

interface ModalLoadingContextType {
  showLoading: (title: string, description?: string) => void;
  showSuccess: (title: string, description?: string, autoClose?: boolean) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  updateProgress: (value: number) => void;
  close: () => void;
  isOpen: boolean;
  state: ModalLoadingState;
}

const ModalLoadingContext = createContext<ModalLoadingContextType | undefined>(undefined);

export function useModalLoadingContext() {
  const context = useContext(ModalLoadingContext);
  if (context === undefined) {
    throw new Error('useModalLoadingContext must be used within a ModalLoadingProvider');
  }
  return context;
}

interface ModalLoadingProviderProps {
  children: React.ReactNode;
}

export function ModalLoadingProvider({ children }: ModalLoadingProviderProps) {
  const modalLoading = useModalLoading();

  const contextValue: ModalLoadingContextType = {
    showLoading: modalLoading.showLoading,
    showSuccess: modalLoading.showSuccess,
    showError: modalLoading.showError,
    showWarning: modalLoading.showWarning,
    updateProgress: modalLoading.updateProgress,
    close: modalLoading.close,
    isOpen: modalLoading.isOpen,
    state: modalLoading.state,
  };

  return (
    <ModalLoadingContext.Provider value={contextValue}>
      {children}
      <ModalLoading
        isOpen={modalLoading.isOpen}
        state={modalLoading.state}
        title={modalLoading.title}
        description={modalLoading.description}
        progress={modalLoading.progress}
        showProgress={modalLoading.progress !== undefined || modalLoading.steps.length > 0}
        steps={modalLoading.steps}
        currentStepId={modalLoading.currentStepId}
        onClose={modalLoading.close}
        autoCloseDelay={modalLoading.state === 'success' ? 2000 : undefined}
      />
    </ModalLoadingContext.Provider>
  );
}

// Convenience hook with common loading patterns
export function useActionLoading() {
  const modalLoading = useModalLoadingContext();

  const executeWithLoading = async <T,>(
    action: () => Promise<T>,
    loadingTitle: string,
    loadingDescription?: string,
    successTitle?: string,
    successDescription?: string
  ): Promise<T> => {
    try {
      modalLoading.showLoading(loadingTitle, loadingDescription);
      const result = await action();
      
      if (successTitle) {
        modalLoading.showSuccess(
          successTitle, 
          successDescription || 'Operation completed successfully'
        );
      } else {
        modalLoading.close();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      modalLoading.showError('Operation Failed', errorMessage);
      throw error;
    }
  };

  const executeWithProgress = async <T,>(
    action: (updateProgress: (progress: number) => void) => Promise<T>,
    loadingTitle: string,
    loadingDescription?: string,
    successTitle?: string,
    successDescription?: string
  ): Promise<T> => {
    try {
      modalLoading.showLoading(loadingTitle, loadingDescription);
      modalLoading.updateProgress(0);
      
      const result = await action((progress) => {
        modalLoading.updateProgress(progress);
      });
      
      modalLoading.updateProgress(100);
      
      if (successTitle) {
        modalLoading.showSuccess(
          successTitle, 
          successDescription || 'Operation completed successfully'
        );
      } else {
        modalLoading.close();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      modalLoading.showError('Operation Failed', errorMessage);
      throw error;
    }
  };

  return {
    ...modalLoading,
    executeWithLoading,
    executeWithProgress,
  };
}
