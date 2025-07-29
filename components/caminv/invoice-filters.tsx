"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface InvoiceFiltersProps {
  searchParams: {
    status?: string;
    direction?: 'outgoing' | 'incoming';
    page?: string;
    limit?: string;
  };
}

export function InvoiceFilters({ searchParams }: InvoiceFiltersProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(currentSearchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset page when filtering
    router.push(`/caminv/invoices?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/caminv/invoices');
  };

  const hasActiveFilters = searchParams.status || searchParams.direction;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Status</Label>
          <Select
            value={searchParams.status || 'all'}
            onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500 shadow-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Direction</Label>
          <Select
            value={searchParams.direction || 'all'}
            onValueChange={(value) => updateFilter('direction', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500 shadow-sm">
              <SelectValue placeholder="All directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All directions</SelectItem>
              <SelectItem value="outgoing">Outgoing</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Date From</Label>
          <Input
            type="date"
            className="bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Date To</Label>
          <Input
            type="date"
            className="bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          <div className="flex items-center gap-2">
            {searchParams.status && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('status', '')}
                className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              >
                Status: {searchParams.status}
                <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {searchParams.direction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('direction', '')}
                className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              >
                Direction: {searchParams.direction}
                <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
