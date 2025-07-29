"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { InvoiceAnalytics } from '@/lib/caminv/analytics-service';

interface InvoiceAnalyticsDashboardProps {
  teamId: number;
}

// Chart configurations
const statusChartConfig = {
  draft: {
    label: "Draft",
    color: "#6B7280",
  },
  submitted: {
    label: "Submitted",
    color: "#F59E0B",
  },
  validated: {
    label: "Validated",
    color: "#10B981",
  },
  accepted: {
    label: "Accepted",
    color: "#059669",
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  total: {
    label: "Total",
    color: "#1E40AF",
  },
  validated: {
    label: "Validated",
    color: "#10B981",
  },
  submitted: {
    label: "Submitted",
    color: "#F59E0B",
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
  },
} satisfies ChartConfig;

export function InvoiceAnalyticsDashboard({ teamId }: InvoiceAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<InvoiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/caminv/analytics?team_id=${teamId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      fetchAnalytics();
    }
  }, [teamId]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !analytics) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load analytics data. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Invoices</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Success Rate</p>
                <p className="text-2xl font-bold text-green-900">{analytics.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{analytics.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">CamInv Managed</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.camInvVsInternal.camInvManaged}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Invoice Status Distribution
            </CardTitle>
            <CardDescription>
              Current status breakdown of all invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={analytics.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {analytics.statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm capitalize">{item.status}</span>
                  <Badge variant="outline" className="ml-auto">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Counts Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Status Counts
            </CardTitle>
            <CardDescription>
              Invoice counts by status with semantic colors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="max-h-[300px]">
              <BarChart data={analytics.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Trends Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Invoice Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>
              Daily invoice status trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="max-h-[300px]">
              <AreaChart data={analytics.statusTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#1E40AF"
                  fill="#1E40AF"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="validated"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stackId="3"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* CamInv vs Internal Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              CamInv Integration Status
            </CardTitle>
            <CardDescription>
              CamInv managed vs internal-only invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                camInvManaged: { label: "CamInv Managed", color: "#1E40AF" },
                internalOnly: { label: "Internal Only", color: "#6B7280" },
              }}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={[
                    { name: "CamInv Managed", value: analytics.camInvVsInternal.camInvManaged, fill: "#1E40AF" },
                    { name: "Internal Only", value: analytics.camInvVsInternal.internalOnly, fill: "#6B7280" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-sm">CamInv Managed</span>
                </div>
                <Badge variant="outline">{analytics.camInvVsInternal.camInvManaged}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Internal Only</span>
                </div>
                <Badge variant="outline">{analytics.camInvVsInternal.internalOnly}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 mb-8">
      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
