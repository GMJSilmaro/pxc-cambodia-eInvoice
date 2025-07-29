'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface OriginalInvoice {
  id: number;
  invoiceNumber: string;
  invoiceUuid: string;
  issueDate: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  status: string;
  camInvStatus?: string;
}

interface OriginalInvoiceSelectorProps {
  merchantId?: string;
  selectedInvoice?: OriginalInvoice | null;
  onInvoiceSelect: (invoice: OriginalInvoice | null) => void;
  disabled?: boolean;
}

export function OriginalInvoiceSelector({
  merchantId,
  selectedInvoice,
  onInvoiceSelect,
  disabled = false
}: OriginalInvoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [invoices, setInvoices] = useState<OriginalInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<OriginalInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoices = async () => {
    if (!merchantId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/caminv/invoices/submitted?merchantId=${merchantId}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.invoices);
        setFilteredInvoices(data.invoices);
      } else {
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && merchantId) {
      fetchInvoices();
    }
  }, [isOpen, merchantId]);

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const handleInvoiceSelect = (invoice: OriginalInvoice) => {
    onInvoiceSelect(invoice);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onInvoiceSelect(null);
  };

  return (
    <div className="space-y-2">
      <Label>Original Invoice Reference</Label>
      <div className="flex gap-2">
        {selectedInvoice ? (
          <div className="flex-1 p-3 border rounded-md bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedInvoice.customerName} • {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {parseFloat(selectedInvoice.totalAmount).toLocaleString()} {selectedInvoice.currency}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={disabled}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <Input
            placeholder="No original invoice selected"
            value=""
            readOnly
            className="flex-1"
          />
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !merchantId}
            >
              <FileText className="h-4 w-4 mr-2" />
              Select Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Select Original Invoice</DialogTitle>
              <DialogDescription>
                Choose the original invoice to reference in this credit/debit note
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-md max-h-96 overflow-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading invoices...
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchTerm ? 'No invoices match your search' : 'No submitted invoices found'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {parseFloat(invoice.totalAmount).toLocaleString()} {invoice.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {invoice.camInvStatus || invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleInvoiceSelect(invoice)}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
