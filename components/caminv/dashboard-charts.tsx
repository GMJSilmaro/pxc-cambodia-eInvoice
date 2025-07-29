'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface InvoiceStats {
  totalInvoices: number;
  submittedInvoices: number;
  pendingInvoices: number;
  acceptedInvoices: number;
  validatedInvoices: number;
  failedInvoices: number;
  successRate: number;
  recentActivity: number;
}

interface DashboardChartsProps {
  stats: InvoiceStats;
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const validationRate = stats.totalInvoices > 0 ? Math.round((stats.validatedInvoices / stats.totalInvoices) * 100) : 0;
  const submissionRate = stats.totalInvoices > 0 ? Math.round((stats.submittedInvoices / stats.totalInvoices) * 100) : 0;
  const acceptanceRate = stats.submittedInvoices > 0 ? Math.round((stats.acceptedInvoices / stats.submittedInvoices) * 100) : 0;

  // Prepare data for charts
  const statusData = [
    {
      name: 'Validated',
      value: stats.validatedInvoices,
      fill: 'hsl(142, 76%, 36%)', // green-600
    },
    {
      name: 'Submitted',
      value: stats.submittedInvoices,
      fill: 'hsl(221, 83%, 53%)', // blue-600
    },
    {
      name: 'Pending',
      value: stats.pendingInvoices,
      fill: 'hsl(45, 93%, 47%)', // yellow-500
    },
    {
      name: 'Failed',
      value: stats.failedInvoices,
      fill: 'hsl(0, 84%, 60%)', // red-500
    },
  ].filter(item => item.value > 0);

  // Mock time series data for trends (in a real app, this would come from the backend)
  const trendData = [
    { month: 'Jan', invoices: 12, success: 10 },
    { month: 'Feb', invoices: 19, success: 16 },
    { month: 'Mar', invoices: 15, success: 13 },
    { month: 'Apr', invoices: 25, success: 22 },
    { month: 'May', invoices: 22, success: 20 },
    { month: 'Jun', invoices: 30, success: 28 },
  ];

  const chartConfig = {
    invoices: {
      label: 'Total Invoices',
      color: 'hsl(var(--chart-1))',
    },
    success: {
      label: 'Successful',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  const pieChartConfig = {
    validated: {
      label: 'Validated',
      color: 'hsl(142, 76%, 36%)',
    },
    submitted: {
      label: 'Submitted',
      color: 'hsl(221, 83%, 53%)',
    },
    pending: {
      label: 'Pending',
      color: 'hsl(45, 93%, 47%)',
    },
    failed: {
      label: 'Failed',
      color: 'hsl(0, 84%, 60%)',
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
      {/* Invoice Status Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-lg">Invoice Status Distribution</CardTitle>
          </div>
          <CardDescription>
            Current status breakdown of all invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart */}
            <div className="flex flex-col">
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>
            </div>

            {/* Status Legend */}
            <div className="flex flex-col justify-center space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{item.value}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.totalInvoices > 0 ? Math.round((item.value / stats.totalInvoices) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="space-y-4 md:space-y-6">
        {/* Invoice Trends Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-base">Invoice Trends</CardTitle>
            </div>
            <CardDescription>
              Monthly invoice volume and success rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart
                accessibilityLayer
                data={trendData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="invoices"
                  type="natural"
                  fill="var(--color-invoices)"
                  fillOpacity={0.4}
                  stroke="var(--color-invoices)"
                  stackId="a"
                />
                <Area
                  dataKey="success"
                  type="natural"
                  fill="var(--color-success)"
                  fillOpacity={0.4}
                  stroke="var(--color-success)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Success Rate Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-base">Success Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{stats.successRate}%</span>
                <div className="flex items-center gap-1">
                  {stats.successRate >= 90 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : stats.successRate >= 70 ? (
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-slate-600">
                    {stats.successRate >= 90 ? 'Excellent' : stats.successRate >= 70 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-600 to-slate-800 transition-all duration-500"
                  style={{ width: `${stats.successRate}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Validation success rate across all submissions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-slate-900">{stats.recentActivity}</span>
              <p className="text-xs text-slate-500">
                Invoices processed in the last 7 days
              </p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12% from last week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
