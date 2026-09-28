import { Link, useLocation, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { navigation, type NavItem, type NavSection } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/layout/logo";
import { isItemActive } from "@/components/shared/layout/app-sidebar-utils";

function NavRow({ item }: { item: NavItem }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = isItemActive(item, location.pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        data-testid={item.title}
        onClick={() => navigate(item.path)}
        tooltip={item.title}
        className={cn(
          "relative h-9 gap-2.5 px-3 text-[13.5px] font-medium text-sidebar-foreground/80 [&_svg]:size-[18px] hover:text-primary",
          "group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:w-10! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden",
          isActive &&
            "text-sidebar-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-r-sm before:bg-sidebar-primary [&_svg]:text-sidebar-primary",
        )}
      >
        <item.icon strokeWidth={1.5} />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarCollapseButton({ size = "sm" }: { size?: "sm" | "md" }) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const Icon = collapsed ? ChevronsRight : ChevronsLeft;
  const dim = size === "md" ? "size-8" : "size-[26px]";
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-transparent text-sidebar-foreground/60 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
        dim,
      )}
    >
      <Icon className="size-[14px]" />
    </button>
  );
}

export function AppSidebar() {
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole === "admin";
  const isInstructor = userRole === "instructor";
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const groups: { id: NavSection; label: string }[] = [
    { id: "Workspace", label: "Workspace" },
    { id: "Learning Services", label: "Learning Services" },
    { id: "Admin", label: "Admin" },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className={cn("flex items-center gap-2 h-14", collapsed ? "justify-center px-0" : "justify-between px-5")}>
          <Link
            to="/home"
            className="flex items-center gap-1.5 min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="Go to Home"
          >
            <Logo height={14} className="text-sidebar-foreground" iconOnly={collapsed} />
          </Link>
          {!collapsed && <SidebarCollapseButton />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((section, idx) => {
          const items = navigation.filter(
            (n) => n.section === section.id && (!n.adminOnly || isAdmin) && !(n.path === "/instructors" && isInstructor),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.id}>
              {idx > 0 && <SidebarSeparator />}
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-sidebar-foreground/55">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <NavRow key={item.path} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          );
        })}
      </SidebarContent>

      {collapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-0 py-1.5">
          <div className="flex justify-center">
            <SidebarCollapseButton size="md" />
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
