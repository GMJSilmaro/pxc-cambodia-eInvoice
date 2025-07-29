'use client';

import { useState, useEffect } from 'react';
import { getCurrentVersion, getLatestUpdate, getUpdatesSince } from '@/lib/updates/version-data';

export function useWhatsNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  useEffect(() => {
    const checkForUpdates = () => {
      try {
        // Check if dismissed today
        const dismissedToday = localStorage.getItem('dismissedToday');
        const today = new Date().toDateString();
        
        if (dismissedToday === today) {
          return;
        }

        // Check for new updates
        const lastSeenVersion = localStorage.getItem('lastSeenVersion');
        const currentVersion = getCurrentVersion();
        
        if (!lastSeenVersion) {
          // First time user - show latest update
          setHasNewUpdates(true);
          setIsOpen(true);
          return;
        }

        if (lastSeenVersion !== currentVersion) {
          // Check if there are actual new updates
          const newUpdates = getUpdatesSince(lastSeenVersion);
          if (newUpdates.length > 0) {
            setHasNewUpdates(true);
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates after a short delay to ensure the app is loaded
    const timer = setTimeout(checkForUpdates, 1000);
    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    // Don't set hasNewUpdates to false here - only when explicitly dismissed
  };

  const dismissToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('dismissedToday', today);
    setIsOpen(false);
    setHasNewUpdates(false);
  };

  const openManually = () => {
    setIsOpen(true);
  };

  const markAllAsSeen = () => {
    const latestUpdate = getLatestUpdate();
    if (latestUpdate) {
      localStorage.setItem('lastSeenVersion', latestUpdate.version);
    }
    setHasNewUpdates(false);
  };

  const recheckForUpdates = () => {
    // Check if dismissed today
    const dismissedToday = localStorage.getItem('dismissedToday');
    const today = new Date().toDateString();

    if (dismissedToday === today) {
      return;
    }

    // Check for new updates
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    const currentVersion = getCurrentVersion();

    if (!lastSeenVersion || lastSeenVersion !== currentVersion) {
      const newUpdates = lastSeenVersion ? getUpdatesSince(lastSeenVersion) : [getLatestUpdate()].filter(Boolean);
      if (newUpdates.length > 0) {
        setHasNewUpdates(true);
        setIsOpen(true);
      }
    }
  };

  return {
    isOpen,
    hasNewUpdates,
    closePopup,
    dismissToday,
    openManually,
    markAllAsSeen,
    recheckForUpdates,
  };
}
