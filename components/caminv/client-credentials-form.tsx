"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

interface ClientCredentialsFormProps {
  onCredentialsSubmit: (credentials: ClientCredentials) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ClientCredentialsForm({ 
  onCredentialsSubmit, 
  isLoading = false, 
  error 
}: ClientCredentialsFormProps) {
  const [credentials, setCredentials] = useState<ClientCredentials>({
    clientId: '',
    clientSecret: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<ClientCredentials>>({});

  const validateCredentials = (): boolean => {
    const errors: Partial<ClientCredentials> = {};
    
    if (!credentials.clientId.trim()) {
      errors.clientId = 'Client ID is required';
    } else if (credentials.clientId.length < 10) {
      errors.clientId = 'Client ID appears to be too short';
    }
    
    if (!credentials.clientSecret.trim()) {
      errors.clientSecret = 'Client Secret is required';
    } else if (credentials.clientSecret.length < 20) {
      errors.clientSecret = 'Client Secret appears to be too short';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCredentials()) {
      onCredentialsSubmit(credentials);
    }
  };

  const handleInputChange = (field: keyof ClientCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          CamInv API Credentials Required
        </CardTitle>
        <CardDescription>
          Enter your CamInv API credentials to connect your merchant account. 
          These credentials are provided by the Cambodia Ministry of Economy and Finance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              type="text"
              placeholder="Enter your CamInv Client ID"
              value={credentials.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              disabled={isLoading}
              className={validationErrors.clientId ? 'border-red-500' : ''}
            />
            {validationErrors.clientId && (
              <p className="text-sm text-red-500">{validationErrors.clientId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <div className="relative">
              <Input
                id="clientSecret"
                type={showSecret ? 'text' : 'password'}
                placeholder="Enter your CamInv Client Secret"
                value={credentials.clientSecret}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                disabled={isLoading}
                className={validationErrors.clientSecret ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
                disabled={isLoading}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {validationErrors.clientSecret && (
              <p className="text-sm text-red-500">{validationErrors.clientSecret}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your credentials are encrypted and stored securely. 
              They are only used to authenticate with the CamInv API and are never shared with third parties.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !credentials.clientId || !credentials.clientSecret}
              className="flex-1"
            >
              {isLoading ? 'Validating...' : 'Continue with Connection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
