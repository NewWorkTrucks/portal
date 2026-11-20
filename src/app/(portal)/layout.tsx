import { PortalCurrentUserProvider } from "@/components/portal-current-user-provider";
import AppHeader from "@/components/layout/app-header";
import TargetCursor from "@/components/target-cursor";

/** Every signed-in portal page: who the user is (mock or live) plus the header. */
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <PortalCurrentUserProvider>
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      <TargetCursor />
    </PortalCurrentUserProvider>
  );
}
