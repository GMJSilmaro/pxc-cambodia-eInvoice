"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function RedirectUrlsManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [urls, setUrls] = useState<string[]>([]);

  // Initialize URLs on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrls([`${window.location.origin}/api/caminv/auth/callback`]);
    }
  }, []);
  const [newUrl, setNewUrl] = useState('');

  const addUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setNewUrl('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/caminv/configure/redirect-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_urls: urls }),
      });
      
      const data = await response.json();
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Redirect URLs configured successfully' : 'Failed to configure URLs'),
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to configure redirect URLs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Current Redirect URLs</Label>
          <div className="mt-2 space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="flex-1 justify-start">
                  {url}
                </Badge>
                {urls.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrl(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="https://yourdomain.com/api/caminv/auth/callback"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addUrl()}
          />
          <Button onClick={addUrl} disabled={!newUrl}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Redirect URLs must be configured with CamInv before 
          initiating OAuth flows. Changes may take a few minutes to take effect.
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="bg-gray-900 hover:bg-gray-800 text-white"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Configure URLs
      </Button>
    </div>
  );
}
