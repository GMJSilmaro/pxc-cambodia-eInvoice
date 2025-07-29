import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  CheckCircle, 
  Send, 
  UserCheck, 
  UserX,
  Clock
} from 'lucide-react';

interface StatusTimelineProps {
  invoice: {
    submittedAt?: string | Date | null;
    status: string;
    sentAt?: string | Date | null;
    acceptedAt?: string | Date | null;
    rejectedAt?: string | Date | null;
    camInvResponse?: any;
  };
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  description?: string;
  badgeColor: string;
}

export function EnhancedStatusTimeline({ invoice }: StatusTimelineProps) {
  const formatTimestamp = (timestamp: string | Date | null | undefined): string | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp.toISOString();
    return timestamp;
  };

  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        id: 'submitted',
        label: 'Submitted',
        icon: Upload,
        status: invoice.submittedAt ? 'completed' : 'pending',
        timestamp: formatTimestamp(invoice.submittedAt),
        description: invoice.submittedAt ? 'Document submitted to CamInv' : 'Waiting for submission',
        badgeColor: invoice.submittedAt ? 'bg-green-600' : 'bg-gray-300'
      },
      {
        id: 'validated',
        label: 'Validated',
        icon: CheckCircle,
        status: invoice.status === 'validated' ? 'completed' : invoice.submittedAt ? 'current' : 'pending',
        timestamp: invoice.status === 'validated' ? 'Validation completed' : undefined,
        description: invoice.status === 'validated' ? 'Document validated successfully' : 'Validation in progress',
        badgeColor: invoice.status === 'validated' ? 'bg-green-500' : invoice.submittedAt ? 'bg-green-400' : 'bg-gray-300'
      },
      {
        id: 'sent',
        label: 'Sent',
        icon: Send,
        status: invoice.sentAt ? 'completed' : 'pending',
        timestamp: formatTimestamp(invoice.sentAt),
        description: invoice.sentAt ? 'Sent to customer' : 'Pending send to customer',
        badgeColor: invoice.sentAt ? 'bg-green-600' : 'bg-gray-300'
      },
      {
        id: 'response',
        label: 'Customer Response',
        icon: invoice.acceptedAt ? UserCheck : invoice.rejectedAt ? UserX : Clock,
        status: invoice.acceptedAt || invoice.rejectedAt ? 'completed' : 'pending',
        timestamp: formatTimestamp(invoice.acceptedAt || invoice.rejectedAt),
        description: invoice.acceptedAt ? 'Accepted by customer' : invoice.rejectedAt ? 'Rejected by customer' : 'Pending customer response',
        badgeColor: invoice.acceptedAt ? 'bg-green-500' : invoice.rejectedAt ? 'bg-green-700' : 'bg-gray-300'
      }
    ];

    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="space-y-6">


      {/* Enhanced Timeline */}
      <div>
        <h4 className="text-sm font-medium text-green-900 mb-4">Status Timeline</h4>
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative flex items-start pb-6">
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-6 ${
                      step.status === 'completed' ? 'bg-green-300' : step.status === 'current' ? 'bg-green-200' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Status Icon */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  step.status === 'completed' ? `${step.badgeColor} border-white shadow-sm` :
                  step.status === 'current' ? 'bg-green-50 border-green-300' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    step.status === 'completed' ? 'text-white' :
                    step.status === 'current' ? 'text-green-700' :
                    'text-gray-400'
                  }`} />
                </div>

                {/* Status Content */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'current' ? 'text-green-800' :
                      'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'completed' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Complete
                      </Badge>
                    )}
                    {step.status === 'current' && (
                      <Badge variant="secondary" className="bg-green-200 text-green-900 border-green-300 text-xs">
                        In Progress
                      </Badge>
                    )}
                  </div>

                  <p className={`text-xs mb-1 ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'current' ? 'text-green-700' :
                    'text-gray-600'
                  }`}>{step.description}</p>

                  {step.timestamp && (
                    <p className={`text-xs ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'current' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {typeof step.timestamp === 'string' && step.timestamp.includes('completed') ?
                        step.timestamp :
                        new Date(step.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
