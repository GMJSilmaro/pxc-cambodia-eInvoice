import CamInvDashboard from "./caminv/page";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome to PXC Cambodia</h1>
            <p className="text-lg text-slate-600 mt-1">E-Invoice Portal for Cambodia Tax Compliance</p>
          </div>
          <Badge variant="outline" className="bg-slate-900 text-white border-slate-900">
            Demo Version
          </Badge>
        </div>


      </div>

      {/* Main Dashboard */}
      {/* <CamInvDashboard /> */}
    </div>
  )
}


