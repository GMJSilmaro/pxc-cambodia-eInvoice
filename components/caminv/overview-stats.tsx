"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface OverviewStatsProps {
  stats: {
    totalInvoices: number;
    submittedInvoices: number;
    pendingInvoices: number;
    acceptedInvoices: number;
  };
}

export function CamInvOverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-blue-700">Total Invoices</CardTitle>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.totalInvoices}</div>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-blue-600">
            All e-invoices created
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-green-700">Submitted</CardTitle>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.submittedInvoices}</div>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-600">
            Successfully submitted to CamInv
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvoices}</div>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-yellow-600">
            Awaiting submission
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-purple-700">Accepted</CardTitle>
            <div className="text-3xl font-bold text-purple-900 mt-2">{stats.acceptedInvoices}</div>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-purple-600">
            Customer accepted
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
