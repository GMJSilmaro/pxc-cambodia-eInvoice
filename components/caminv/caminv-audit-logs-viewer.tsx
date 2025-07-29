'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FileText,
  Send,
  Building2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  User,
  Calendar,
  type LucideIcon,
} from 'lucide-react'

interface CamInvAuditLog {
  id: number
  action: string
  entityType: string
  entityId: number | null
  details: any
  createdAt: string
  userName: string | null
  ipAddress: string | null
}

const actionIconMap: Record<string, LucideIcon> = {
  'submit_invoice': Upload,
  'send_invoice': Send,
  'accept_invoice': CheckCircle,
  'reject_invoice': AlertCircle,
  'connect_merchant': Building2,
  'disconnect_merchant': Building2,
  'get_document': Download,
  'check_customer': User,
  'sync_merchant': RefreshCw,
  'webhook_received': ExternalLink,
}

const actionLabelMap: Record<string, string> = {
  'submit_invoice': 'Invoice Submitted',
  'send_invoice': 'Invoice Sent to Customer',
  'accept_invoice': 'Invoice Accepted',
  'reject_invoice': 'Invoice Rejected',
  'connect_merchant': 'Merchant Connected',
  'disconnect_merchant': 'Merchant Disconnected',
  'get_document': 'Document Retrieved',
  'check_customer': 'Customer Profile Checked',
  'sync_merchant': 'Merchant Data Synced',
  'webhook_received': 'Webhook Event Received',
}

function getStatusColor(action: string): string {
  switch (action) {
    case 'accept_invoice':
    case 'connect_merchant':
      return 'text-green-600 bg-green-50'
    case 'reject_invoice':
    case 'disconnect_merchant':
      return 'text-red-600 bg-red-50'
    case 'submit_invoice':
    case 'send_invoice':
    case 'sync_merchant':
      return 'text-yellow-600 bg-yellow-50'
    case 'get_document':
    case 'check_customer':
      return 'text-blue-600 bg-blue-50'
    case 'webhook_received':
      return 'text-purple-600 bg-purple-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

function getStatusBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'accept_invoice':
    case 'connect_merchant':
      return 'default'
    case 'reject_invoice':
    case 'disconnect_merchant':
      return 'destructive'
    case 'submit_invoice':
    case 'send_invoice':
      return 'secondary'
    default:
      return 'outline'
  }
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateString))
}

function formatEntityDetails(entityType: string, details: any): string {
  if (!details) return ''
  
  switch (entityType) {
    case 'invoice':
      return details.invoiceNumber ? `Invoice #${details.invoiceNumber}` : ''
    case 'merchant':
      return details.merchantName ? `${details.merchantName}` : ''
    case 'customer':
      return details.customerName ? `${details.customerName}` : ''
    default:
      return ''
  }
}

function AuditLogsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full mt-1" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CamInvAuditLogsViewer() {
  const [logs, setLogs] = useState<CamInvAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (actionFilter) params.append('action', actionFilter)
      if (entityFilter) params.append('entity', entityFilter)
      
      const response = await fetch(`/api/caminv/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSearch = () => {
    fetchLogs()
  }

  const handleReset = () => {
    setSearchTerm('')
    setActionFilter('')
    setEntityFilter('')
    fetchLogs()
  }

  if (isLoading) {
    return <AuditLogsSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, merchant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <Select value={actionFilter || "all"} onValueChange={(value) => setActionFilter(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="submit_invoice">Submit Invoice</SelectItem>
            <SelectItem value="send_invoice">Send Invoice</SelectItem>
            <SelectItem value="accept_invoice">Accept Invoice</SelectItem>
            <SelectItem value="reject_invoice">Reject Invoice</SelectItem>
            <SelectItem value="connect_merchant">Connect Merchant</SelectItem>
            <SelectItem value="get_document">Get Document</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter || "all"} onValueChange={(value) => setEntityFilter(value === "all" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="merchant">Merchants</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Audit Logs */}
      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = actionIconMap[log.action] || FileText
            const actionLabel = actionLabelMap[log.action] || log.action
            const statusColor = getStatusColor(log.action)
            const badgeVariant = getStatusBadgeVariant(log.action)
            const entityDetails = formatEntityDetails(log.entityType, log.details)
            
            return (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${statusColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {actionLabel}
                    </p>
                    <Badge variant={badgeVariant} className="text-xs">
                      {log.entityType}
                    </Badge>
                  </div>
                  {entityDetails && (
                    <p className="text-sm text-gray-600 mb-1">
                      {entityDetails}
                    </p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    {log.userName && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{log.userName}</span>
                      </div>
                    )}
                    {log.details?.status && (
                      <Badge variant="outline" className="text-xs">
                        {log.details.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Building2 className="h-10 w-10 text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            No CamInv operations yet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm">
            CamInv operations like invoice submissions and merchant connections will appear here
          </p>
        </div>
      )}
    </div>
  )
}
