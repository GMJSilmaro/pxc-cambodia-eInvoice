"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Settings, RefreshCw, Unplug, Loader2, User } from 'lucide-react';
import { MerchantProfileDialog } from './merchant-profile-dialog';
import { toast } from 'sonner';

interface MerchantCardProps {
  merchant: {
    id: number;
    merchantName: string;
    isActive: boolean;
    endpointId?: string;
    companyNameEn?: string;
    companyNameKh?: string;
    tin?: string;
  };
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);

      const response = await fetch(`/api/caminv/merchants/${merchant.id}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect merchant');
      }

      toast.success('Merchant disconnected successfully');

      // Redirect to merchants page with success message
      router.push('/caminv/merchants?success=merchant-disconnected');

    } catch (error) {
      console.error('Error disconnecting merchant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect merchant');
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <MerchantProfileDialog
              merchant={merchant}
              trigger={
                <div className="flex items-center w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </div>
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!merchant.isActive}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Data
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            disabled={!merchant.isActive}
            onClick={() => setShowDisconnectDialog(true)}
          >
            <Unplug className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Merchant</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to disconnect "{merchant.merchantName}"? This will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Revoke the connection with CamInv</li>
                  <li>Remove access tokens and credentials</li>
                  <li>Stop all e-invoice operations</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone. You'll need to reconnect to resume operations.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
