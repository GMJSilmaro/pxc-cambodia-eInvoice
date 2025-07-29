"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClientCredentialsForm } from './client-credentials-form';

interface MerchantConnectionButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

export function MerchantConnectionButton({
  variant = 'default',
  size = 'default'
}: MerchantConnectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | 'info' | 'redirect' | 'configuring'>('credentials');
  const [credentials, setCredentials] = useState<ClientCredentials | null>(null);
  const router = useRouter();

  const handleCredentialsSubmit = async (clientCredentials: ClientCredentials) => {
    setIsConnecting(true);
    setError(null);
    setStep('configuring');

    try {
      // Configure client credentials and redirect URLs
      const redirectUrl = `${window.location.origin}/api/caminv/auth/callback`;

      const configResponse = await fetch('/api/caminv/configure/client-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientCredentials.clientId,
          clientSecret: clientCredentials.clientSecret,
          redirectUrls: [redirectUrl]
        }),
      });

      const configData = await configResponse.json();

      if (!configResponse.ok) {
        // Handle different types of errors
        if (configData.network_error) {
          const errorMessage = configData.error || 'Network error occurred while connecting to CamInv API. Please check your internet connection and try again.';
          const fallbackMessage = configData.fallback_available ?
            '\n\nYou can enable mock mode for development by setting CAMINV_MOCK_API=true in your .env file' : '';
          throw new Error(errorMessage + fallbackMessage);
        } else if (configData.credentials_invalid) {
          throw new Error('Invalid credentials: ' + configData.error);
        } else {
          throw new Error(configData.error || 'Failed to configure client credentials');
        }
      }

      // Store credentials for the OAuth flow
      setCredentials(clientCredentials);

      if (configData.development_mode) {
        setStep('info');
        setError('Development mode: Using mock API responses');
      } else {
        setStep('redirect');

        // Small delay to show the configuration step
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to CamInv OAuth with credentials
        const authUrl = `/api/caminv/auth/authorize?client_id=${encodeURIComponent(clientCredentials.clientId)}`;
        window.location.href = authUrl;
      }

    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to CamInv');
      setStep('credentials');
    } finally {
      setIsConnecting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'credentials':
        return (
          <ClientCredentialsForm
            onCredentialsSubmit={handleCredentialsSubmit}
            isLoading={isConnecting}
            error={error}
          />
        );

      case 'configuring':
        return (
          <div className="text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Configuring Connection</h3>
            <p className="text-muted-foreground">
              Setting up OAuth redirect URLs with CamInv...
            </p>
          </div>
        );

      case 'redirect':
        return (
          <div className="text-center py-6">
            <ExternalLink className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Redirecting to CamInv</h3>
            <p className="text-muted-foreground">
              You will be redirected to CamInv for authentication...
            </p>
          </div>
        );

      case 'info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Connect CamInv Merchant Account</h3>
              <p className="text-muted-foreground">
                Securely connect your Cambodia E-Invoicing merchant account to start 
                issuing compliant e-invoices.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Secure OAuth2 Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Your credentials are never stored on our servers
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Real-time Synchronization</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic sync with CamInv for invoice status updates
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">UBL 2.1 Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic generation of compliant UBL XML documents
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Requirements:</strong> You need an active CamInv merchant account 
                with valid TIN and Ministry of Commerce registration to proceed.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('credentials')}
                disabled={isConnecting}
                className="flex-1"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Configure Credentials
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isConnecting}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Building2 className="h-4 w-4 mr-2" />
          Connect Merchant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CamInv Integration</DialogTitle>
          <DialogDescription>
            Connect your Cambodia E-Invoicing merchant account
          </DialogDescription>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
