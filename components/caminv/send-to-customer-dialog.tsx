"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SendToCustomerDialogProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    customerName: string;
    customerEmail?: string;
    status: string;
    documentId?: string;
  };
  trigger?: React.ReactNode;
}

export function SendToCustomerDialog({ invoice, trigger }: SendToCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(invoice.customerEmail || '');
  const [message, setMessage] = useState(
    `Dear ${invoice.customerName},\n\nPlease find your e-invoice ${invoice.invoiceNumber} attached.\n\nBest regards`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email) {
      setError('Customer email is required');
      return;
    }

    if (invoice.status !== 'submitted') {
      setError('Invoice must be submitted before sending to customer');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Show loading toast
    toast.loading('Sending invoice to customer...', { id: 'send-invoice' });

    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: email,
          message: message.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        toast.success('Invoice Sent Successfully!', {
          id: 'send-invoice',
          description: `Invoice ${invoice.invoiceNumber} has been sent to ${email}`,
          duration: 5000,
        });

        setOpen(false);

        // Refresh the page to update the invoice status
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send invoice');

        toast.error('Failed to Send Invoice', {
          id: 'send-invoice',
          description: errorData.error || 'An error occurred while sending the invoice',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Send failed:', error);
      setError('An unexpected error occurred');

      toast.error('Failed to Send Invoice', {
        id: 'send-invoice',
        description: 'An unexpected error occurred while sending the invoice',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700">
      <Mail className="h-4 w-4 mr-2" />
      Send to Customer
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md lg:max-w-lg bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Send Invoice to Customer</DialogTitle>
          <DialogDescription className="text-gray-600">
            Send invoice {invoice.invoiceNumber} to your customer via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-email">Customer Email</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Invoice Details:</strong>
              <br />
              Number: {invoice.invoiceNumber}
              <br />
              Customer: {invoice.customerName}
              <br />
              Status: {invoice.status}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !email}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Sending invoice...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
