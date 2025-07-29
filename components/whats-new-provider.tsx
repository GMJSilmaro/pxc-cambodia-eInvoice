'use client';

import React from 'react';
import { WhatsNewPopup } from './whats-new-popup';
import { useWhatsNew } from '@/hooks/use-whats-new';

export function WhatsNewProvider() {
  const { isOpen, closePopup, dismissToday } = useWhatsNew();

  return (
    <WhatsNewPopup
      isOpen={isOpen}
      onClose={closePopup}
      onDismissToday={dismissToday}
    />
  );
}
