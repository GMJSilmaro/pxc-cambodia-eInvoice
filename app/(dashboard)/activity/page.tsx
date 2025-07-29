import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
  TooltipProvider
} from '@/components/ui/tooltip'
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  FileText,
  Send,
  Building2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { ActivityType } from '@/lib/db/schema'
import { getActivityLogs } from '@/lib/db/queries'
import { CamInvAuditLogsViewer } from '@/components/caminv/caminv-audit-logs-viewer'

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  // CamInv Activities
  [ActivityType.CAMINV_MERCHANT_CONNECTED]: Building2,
  [ActivityType.CAMINV_INVOICE_SUBMITTED]: Upload,
  [ActivityType.CAMINV_INVOICE_SENT]: Send,
  [ActivityType.CAMINV_INVOICE_ACCEPTED]: CheckCircle,
  [ActivityType.CAMINV_INVOICE_REJECTED]: AlertCircle,
}

function formatAction(action: ActivityType): string {
  const actionMap: Record<ActivityType, string> = {
    [ActivityType.SIGN_UP]: 'Signed up',
    [ActivityType.SIGN_IN]: 'Signed in',
    [ActivityType.SIGN_OUT]: 'Signed out',
    [ActivityType.UPDATE_PASSWORD]: 'Updated password',
    [ActivityType.DELETE_ACCOUNT]: 'Deleted account',
    [ActivityType.UPDATE_ACCOUNT]: 'Updated account',
    [ActivityType.CREATE_TEAM]: 'Created team',
    [ActivityType.REMOVE_TEAM_MEMBER]: 'Removed team member',
    [ActivityType.INVITE_TEAM_MEMBER]: 'Invited team member',
    [ActivityType.ACCEPT_INVITATION]: 'Accepted invitation',
    // CamInv Activities
    [ActivityType.CAMINV_MERCHANT_CONNECTED]: 'Connected CamInv merchant',
    [ActivityType.CAMINV_INVOICE_SUBMITTED]: 'Submitted invoice to CamInv',
    [ActivityType.CAMINV_INVOICE_SENT]: 'Sent invoice to customer',
    [ActivityType.CAMINV_INVOICE_ACCEPTED]: 'Invoice accepted by CamInv',
    [ActivityType.CAMINV_INVOICE_REJECTED]: 'Invoice rejected by CamInv',
  }

  return actionMap[action] || action
}

function getStatusColor(action: ActivityType): string {
  switch (action) {
    case ActivityType.CAMINV_INVOICE_ACCEPTED:
      return 'text-green-600'
    case ActivityType.CAMINV_INVOICE_REJECTED:
      return 'text-red-600'
    case ActivityType.CAMINV_INVOICE_SUBMITTED:
    case ActivityType.CAMINV_INVOICE_SENT:
      return 'text-yellow-600'
    case ActivityType.CAMINV_MERCHANT_CONNECTED:
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function ActivityLogsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ActivityPage() {
  const logs = await getActivityLogs()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Activity & Audit Logs
          </h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Real-time tracking
            </Badge>
          </div>
        </div>

        {/* General Activity Logs */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span>Account Activity</span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  User authentication and account management activities
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <ul className="space-y-3">
                {logs.map((log) => {
                  const Icon = iconMap[log.action as ActivityType] || Settings
                  const formattedAction = formatAction(log.action as ActivityType)
                  const statusColor = getStatusColor(log.action as ActivityType)

                  return (
                    <li
                      key={log.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-full bg-white ${statusColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formattedAction}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </p>
                          {log.userName && (
                            <Badge variant="secondary" className="text-xs">
                              {log.userName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  No account activity yet
                </h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Account activities like sign-ins and profile updates will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CamInv Audit Logs */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>CamInv Operations</span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Comprehensive audit trail for all CamInv e-invoice operations and API interactions
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ActivityLogsSkeleton />}>
              <CamInvAuditLogsViewer />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
