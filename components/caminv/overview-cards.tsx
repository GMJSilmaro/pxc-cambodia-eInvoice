import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  variant: "default" | "pending" | "success" | "error";
}

const cardVariants = {
  default: {
    gradient: "bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900",
    icon: "text-blue-400 bg-blue-500/20",
    badge: "bg-blue-500/80",
    text: "text-white",
    accent: "text-blue-200"
  },
  pending: {
    gradient: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
    icon: "text-slate-300 bg-slate-500/20",
    badge: "bg-slate-500/80",
    text: "text-white",
    accent: "text-slate-300"
  },
  success: {
    gradient: "bg-gradient-to-br from-slate-800 via-green-900 to-emerald-900",
    icon: "text-green-400 bg-green-500/20",
    badge: "bg-green-500/80",
    text: "text-white",
    accent: "text-green-200"
  },
  error: {
    gradient: "bg-gradient-to-br from-slate-800 via-red-900 to-red-800",
    icon: "text-red-400 bg-red-500/20",
    badge: "bg-red-500/80",
    text: "text-white",
    accent: "text-red-200"
  }
};

function OverviewCard({ title, value, description, icon, variant }: OverviewCardProps) {
  const styles = cardVariants[variant];

  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-lg", styles.gradient)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", styles.accent)}>{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
            <p className={cn("text-sm", styles.accent)}>{description}</p>
          </div>
          <div className={cn("p-3 rounded-full", styles.icon)}>
            {icon}
          </div>
        </div>
        <Badge className={cn("absolute top-4 right-4 text-white border-0", styles.badge)}>
          {variant === "default" ? "D" : variant === "pending" ? "P" : variant === "success" ? "V" : "R"}
        </Badge>
      </CardContent>
    </Card>
  );
}

interface OverviewCardsProps {
  stats: {
    total: number;
    pending: number;
    validated: number;
    rejected: number;
  };
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Invoices"
          value={stats.total}
          description="All items"
          icon={<FileText className="h-6 w-6" />}
          variant="default"
        />
        <OverviewCard
          title="Pending"
          value={stats.pending}
          description="Awaiting submission"
          icon={<Clock className="h-6 w-6" />}
          variant="pending"
        />
        <OverviewCard
          title="Validated"
          value={stats.validated}
          description="Successfully processed"
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
        <OverviewCard
          title="Rejected"
          value={stats.rejected}
          description="Require attention"
          icon={<XCircle className="h-6 w-6" />}
          variant="error"
        />
      </div>
    </div>
  );
}
