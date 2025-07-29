"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Send,
  Download
} from 'lucide-react';

interface InvoiceStatsProps {
  invoices: any[];
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const stats = {
    total: invoices.length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    submitted: invoices.filter(inv => inv.status === 'submitted').length,
    validated: invoices.filter(inv => inv.status === 'validated' || inv.camInvStatus === 'validated').length,
    outgoing: invoices.filter(inv => inv.direction === 'outgoing').length,
    incoming: invoices.filter(inv => inv.direction === 'incoming').length,
    accepted: invoices.filter(inv => inv.status === 'accepted').length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">All invoices in system</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
            <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Pending completion</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Submitted</CardTitle>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Sent to CamInv</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Validated</CardTitle>
            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">CamInv approved</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Outgoing</CardTitle>
            <div className="text-2xl font-bold text-gray-900">{stats.outgoing}</div>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <Send className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Sent to customers</p>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600">Incoming</CardTitle>
            <div className="text-2xl font-bold text-gray-900">{stats.incoming}</div>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <Download className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Received invoices</p>
        </CardContent>
      </Card>
    </div>
  );
}
