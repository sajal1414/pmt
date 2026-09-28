import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopnav } from "./app-topnav";
import { BreadcrumbProvider } from "./breadcrumb-provider";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ScrollToTop />
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <BreadcrumbProvider>
          <AppTopnav />
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4">
            <Outlet />
          </main>
        </BreadcrumbProvider>
        <footer className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          © {new Date().getFullYear()} nFolks. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
