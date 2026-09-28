import { useContext, useState } from "react";
import { useLocation, Link } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, UserCog } from "lucide-react";
import { formatEnumLabel } from "@/components/shared/status-badge";
import { navigation } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/hooks/use-logout";
import { useInstructor } from "@/hooks/use-instructors";
import { InstructorFormDialog } from "@/pages/instructors/instructor-form-dialog";
import { BreadcrumbContext } from "./breadcrumb-context";

function buildBreadcrumbs(pathname: string, extraCrumbs: { label: string; path?: string }[]) {
  const match = navigation.find((n) => pathname === n.path || pathname.startsWith(n.path + "/"));
  const crumbs = match ? [{ label: match.title, path: match.path }] : [];
  return [...crumbs, ...extraCrumbs];
}

export function AppTopnav() {
  const location = useLocation();
  const ctx = useContext(BreadcrumbContext);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const crumbs = buildBreadcrumbs(location.pathname, ctx?.extraCrumbs ?? []);
  const [manageOpen, setManageOpen] = useState(false);

  const isInstructor = user?.role === "instructor";
  const { data: instructorData } = useInstructor(user?.instructorId ?? undefined);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 bg-surface">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, idx) => (
              <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                {idx > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {idx === crumbs.length - 1 || !crumb.path ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={crumb.path} />}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary font-medium text-primary-foreground">
                {(user?.fullName ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-1.5 py-1">
              <p className="truncate text-sm font-medium">{user?.fullName || user?.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              {user?.role && <p className="mt-1 text-xs font-medium text-primary">{formatEnumLabel(user.role)}</p>}
            </div>
            <DropdownMenuSeparator />
            {isInstructor && (
              <>
                <DropdownMenuItem onClick={() => setManageOpen(true)}>
                  <UserCog className="size-4" />
                  Manage Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isInstructor && (
          <InstructorFormDialog
            open={manageOpen}
            onOpenChange={setManageOpen}
            instructor={instructorData ?? (user?.instructorId ? ({ id: user.instructorId, name: user.fullName || "", email: user.email } as never) : null)}
          />
        )}
      </div>
    </header>
  );
}
