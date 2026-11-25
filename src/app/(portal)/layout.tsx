import AccessLogVisitRecorder from "@/components/access-log/access-log-visit-recorder";
import { PortalCurrentUserProvider } from "@/components/portal-current-user-provider";
import AppHeader from "@/components/layout/app-header";
import PortalSidebar from "@/components/layout/portal-sidebar";

/**
 * Every signed-in portal page: who the user is (mock or live), a full-height left navigation
 * from md up, and the header above the page content.
 */
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <PortalCurrentUserProvider>
      <AccessLogVisitRecorder />
      <div className="flex min-h-0 flex-1">
        <PortalSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </div>
    </PortalCurrentUserProvider>
  );
}
