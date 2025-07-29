"use client";

import { ArrowLeft, FileText, Download, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  }[];
}

export function PageHeader({
  title,
  description,
  icon = <FileText className="h-6 w-6" />,
  showBackButton = true,
  backUrl = "/caminv",
  actions = []
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const handleAction = (action: PageHeaderProps['actions'][0]) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {showBackButton && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-slate-600 hover:text-slate-900 p-0 h-auto font-normal"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg shadow-md">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-1">{description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                onClick={() => handleAction(action)}
                className={action.variant === "default" ? "bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 shadow-md" : ""}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Common action configurations for reuse
export const commonActions = {
  export: {
    label: "Export",
    icon: <Download className="h-4 w-4 mr-2" />,
    variant: "outline" as const
  },
  import: {
    label: "Import",
    icon: <Upload className="h-4 w-4 mr-2" />,
    variant: "outline" as const
  },
  createInvoice: {
    label: "Create Invoice",
    icon: <Plus className="h-4 w-4 mr-2" />,
    variant: "default" as const,
    href: "/caminv/invoices/create"
  }
};
