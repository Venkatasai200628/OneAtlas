import { DashboardSidebar } from "@/components/layouts/sidebar";
import { DashboardTopnav } from "@/components/layouts/topnav";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F5F5EE] overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardTopnav />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
