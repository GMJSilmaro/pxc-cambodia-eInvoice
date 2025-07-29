"use client";

import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface InvoiceStatusTimelineProps {
  invoice: {
    status: string;
    createdAt: string;
    submittedAt?: string;
    sentAt?: string;
    acceptedAt?: string;
    rejectedAt?: string;
  };
}

export function InvoiceStatusTimeline({ invoice }: InvoiceStatusTimelineProps) {
  const events = [
    {
      status: 'created',
      label: 'Invoice Created',
      timestamp: invoice.createdAt,
      icon: FileText,
      completed: true,
    },
    {
      status: 'submitted',
      label: 'Submitted to CamInv',
      timestamp: invoice.submittedAt,
      icon: Send,
      completed: !!invoice.submittedAt,
    },
    {
      status: 'sent',
      label: 'Sent to Customer',
      timestamp: invoice.sentAt,
      icon: Send,
      completed: !!invoice.sentAt,
    },
    {
      status: 'accepted',
      label: 'Accepted by Customer',
      timestamp: invoice.acceptedAt,
      icon: CheckCircle2,
      completed: !!invoice.acceptedAt,
    },
  ];

  if (invoice.rejectedAt) {
    events.push({
      status: 'rejected',
      label: 'Rejected by Customer',
      timestamp: invoice.rejectedAt,
      icon: AlertCircle,
      completed: true,
    });
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        const isRejected = event.status === 'rejected';

        return (
          <div key={event.status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-full border-2 transition-all duration-200 ${
                event.completed
                  ? isRejected
                    ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                    : 'bg-green-50 text-green-600 border-green-200 shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}>
                <Icon className={`h-5 w-5 ${
                  event.icon === CheckCircle2 && event.completed ? 'animate-pulse' : ''
                }`} />
              </div>
              {!isLast && (
                <div className={`w-0.5 h-12 mt-3 rounded-full transition-all duration-300 ${
                  event.completed
                    ? isRejected
                      ? 'bg-red-200'
                      : 'bg-green-200'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-base font-semibold transition-colors duration-200 ${
                  event.completed
                    ? isRejected
                      ? 'text-red-900'
                      : 'text-green-900'
                    : 'text-gray-500'
                }`}>
                  {event.label}
                </h4>
                {event.completed && (
                  <Badge
                    variant={isRejected ? "destructive" : "default"}
                    className={`text-xs font-medium ${
                      isRejected
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                    }`}
                  >
                    {isRejected ? 'Rejected' : 'Completed'}
                  </Badge>
                )}
              </div>

              {event.timestamp && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  event.completed
                    ? isRejected
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  <Clock className="h-3 w-3" />
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}

              {!event.completed && event.status !== 'created' && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  Pending completion...
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Progress indicator */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">Progress</span>
          <span className="text-sm font-semibold text-blue-700">
            {events.filter(e => e.completed).length} of {events.length} completed
          </span>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(events.filter(e => e.completed).length / events.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
