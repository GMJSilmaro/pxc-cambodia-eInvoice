'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Calendar, Sparkles } from 'lucide-react';
import { 
  getLatestUpdate, 
  getUpdatesSince, 
  getTypeIcon, 
  getTypeLabel, 
  getTypeColor,
  type VersionUpdate 
} from '@/lib/updates/version-data';

interface WhatsNewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissToday: () => void;
}

export function WhatsNewPopup({ isOpen, onClose, onDismissToday }: WhatsNewPopupProps) {
  const [updates, setUpdates] = useState<VersionUpdate[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Get updates since last seen version
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      const newUpdates = lastSeenVersion 
        ? getUpdatesSince(lastSeenVersion)
        : [getLatestUpdate()].filter(Boolean) as VersionUpdate[];
      
      setUpdates(newUpdates);
    }
  }, [isOpen]);

  const handleClose = () => {
    // Just close the dialog without marking as seen permanently
    onClose();
  };

  const handleDismissToday = () => {
    // Set dismiss flag for today AND mark version as seen
    const today = new Date().toDateString();
    localStorage.setItem('dismissedToday', today);

    // Mark current version as seen permanently
    const latestUpdate = getLatestUpdate();
    if (latestUpdate) {
      localStorage.setItem('lastSeenVersion', latestUpdate.version);
    }

    onClose();
    onDismissToday();
  };

  if (updates.length === 0) {
    return null;
  }

  const latestUpdate = updates[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                What's New in v{latestUpdate.version}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                {latestUpdate.title}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Released on {new Date(latestUpdate.releaseDate).toLocaleDateString()}</span>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6">
            <p className="text-slate-700 leading-relaxed">
              {latestUpdate.description}
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">New Features & Improvements</h3>
              <div className="space-y-3">
                {latestUpdate.updates.map((update) => (
                  <div key={update.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex-shrink-0 text-lg">
                      {update.icon || getTypeIcon(update.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{update.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(update.type)}`}
                        >
                          {getTypeLabel(update.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{update.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {updates.length > 1 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Previous Updates</h3>
                <div className="space-y-2">
                  {updates.slice(1).map((update) => (
                    <div key={update.version} className="p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">v{update.version}</h4>
                        <span className="text-xs text-slate-500">
                          {new Date(update.releaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{update.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleDismissToday}
            className="text-slate-600 hover:text-slate-800"
          >
            Don't show today
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/updates', '_blank')}
            >
              View All Updates
            </Button>
            <Button
              onClick={handleClose}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
