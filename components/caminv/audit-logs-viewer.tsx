"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, RefreshCw, Filter } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: any;
  createdAt: string;
  userId?: number;
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      
      const response = await fetch(`/api/caminv/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const actionConfig = {
      MERCHANT_CONNECTED: { variant: 'default' as const, label: 'Merchant Connected' },
      INVOICE_CREATED: { variant: 'default' as const, label: 'Invoice Created' },
      INVOICE_SUBMITTED: { variant: 'default' as const, label: 'Invoice Submitted' },
      INVOICE_ACCEPTED: { variant: 'default' as const, label: 'Invoice Accepted', className: 'bg-green-500' },
      INVOICE_REJECTED: { variant: 'destructive' as const, label: 'Invoice Rejected' },
      DOCUMENTS_SUBMITTED: { variant: 'default' as const, label: 'Documents Submitted' },
    };
    
    const config = actionConfig[action as keyof typeof actionConfig] || { 
      variant: 'outline' as const, 
      label: action.replace('_', ' ') 
    };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="MERCHANT_CONNECTED">Merchant Connected</SelectItem>
            <SelectItem value="INVOICE_CREATED">Invoice Created</SelectItem>
            <SelectItem value="INVOICE_SUBMITTED">Invoice Submitted</SelectItem>
            <SelectItem value="INVOICE_ACCEPTED">Invoice Accepted</SelectItem>
            <SelectItem value="INVOICE_REJECTED">Invoice Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading audit logs...' : 'No audit logs found'}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium capitalize">{log.entityType}</span>
                      <span className="text-muted-foreground"> #{log.entityId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : 'No details'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
