"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  FileText,
  Building2,
  Zap
} from 'lucide-react';

interface ActionableInsightsProps {
  stats: {
    totalInvoices: number;
    submittedInvoices: number;
    pendingInvoices: number;
    acceptedInvoices: number;
    validatedInvoices: number;
    failedInvoices: number;
    successRate: number;
    recentActivity: number;
  };
  merchantCount: number;
  hasActiveMerchant: boolean;
}

export function ActionableInsights({ stats, merchantCount, hasActiveMerchant }: ActionableInsightsProps) {
  const insights = [];

  // Check for pending invoices
  if (stats.pendingInvoices > 0) {
    insights.push({
      type: 'action',
      icon: Clock,
      title: `${stats.pendingInvoices} Pending Invoice${stats.pendingInvoices > 1 ? 's' : ''}`,
      description: 'Ready for submission to CamInv',
      action: {
        label: 'Submit Now',
        href: '/caminv/invoices?status=draft'
      },
      priority: 'high'
    });
  }

  // Check for merchant connection
  if (!hasActiveMerchant) {
    insights.push({
      type: 'warning',
      icon: Building2,
      title: 'No Active Merchant Account',
      description: 'Connect your CamInv merchant account to start issuing e-invoices',
      action: {
        label: 'Connect Merchant',
        href: '/caminv/merchants'
      },
      priority: 'critical'
    });
  }

  // Check success rate
  if (stats.successRate < 90 && stats.totalInvoices > 5) {
    insights.push({
      type: 'warning',
      icon: TrendingUp,
      title: 'Low Success Rate',
      description: `${stats.successRate}% validation rate. Review failed invoices for common issues`,
      action: {
        label: 'Review Failed',
        href: '/caminv/invoices?status=failed'
      },
      priority: 'medium'
    });
  }

  // Check for recent activity
  if (stats.recentActivity === 0 && stats.totalInvoices > 0) {
    insights.push({
      type: 'info',
      icon: Zap,
      title: 'No Recent Activity',
      description: 'No invoices created in the last 7 days',
      action: {
        label: 'Create Invoice',
        href: '/caminv/invoices/create'
      },
      priority: 'low'
    });
  }

  // Success message
  if (stats.successRate >= 95 && stats.totalInvoices > 10) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Excellent Performance',
      description: `${stats.successRate}% success rate with ${stats.totalInvoices} invoices`,
      priority: 'info'
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: 'All Good!',
      description: 'Your CamInv integration is running smoothly',
      priority: 'info'
    });
  }

  const getInsightConfig = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bgClass: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'action':
        return {
          bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'success':
        return {
          bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      default:
        return {
          bgClass: 'bg-gradient-to-r from-gray-50 to-white border-gray-200',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 text-xs">Critical</Badge>;
      case 'high':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 text-xs">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs">Medium</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          Actionable Insights
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Key actions and recommendations for your e-invoicing workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight, index) => {
            const IconComponent = insight.icon;
            const config = getInsightConfig(insight.type);
            return (
              <Card key={index} className={`${config.bgClass} transition-all duration-200 hover:shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shadow-sm ${config.iconBg}`}>
                      <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-base text-gray-900">{insight.title}</h4>
                        {getPriorityBadge(insight.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{insight.description}</p>
                      {insight.action && (
                        <Button variant="outline" size="sm" asChild className="bg-white hover:bg-gray-50 shadow-sm">
                          <a href={insight.action.href}>
                            {insight.action.label}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
