"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, TestTube, AlertCircle, CheckCircle2 } from 'lucide-react';

export function CamInvConfigForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [config, setConfig] = useState({
    baseUrl: process.env.NEXT_PUBLIC_CAMINV_BASE_URL || '',
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
  });

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Test API connection
      const response = await fetch('/api/caminv/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Connection successful' : 'Connection failed'),
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/caminv/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Configuration saved successfully',
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to save configuration',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select 
            value={config.environment} 
            onValueChange={(value) => setConfig({...config, environment: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            value={config.baseUrl}
            onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
            placeholder="https://api.caminv.gov.kh"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={config.clientId}
            onChange={(e) => setConfig({...config, clientId: e.target.value})}
            placeholder="Your CamInv client ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <Input
            id="clientSecret"
            type="password"
            value={config.clientSecret}
            onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
            placeholder="Your CamInv client secret"
          />
        </div>
      </div>

      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleTest}
          disabled={isTesting}
          variant="outline"
          className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          Test Connection
        </Button>

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
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
