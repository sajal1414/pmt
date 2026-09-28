import { LayoutDashboard, BookOpen, Users, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavSection = "Workspace" | "Learning Services" | "Admin";

export interface NavItem {
  title: string;
  icon: LucideIcon;
  path: string;
  section: NavSection;
  pathPrefix?: string;
  /** Hidden from the sidebar unless the current user's role is `admin`. */
  adminOnly?: boolean;
}

export const navigation: NavItem[] = [
  { section: "Workspace", title: "Home", path: "/home", icon: LayoutDashboard },
  { section: "Learning Services", title: "Courses", path: "/courses", icon: BookOpen, pathPrefix: "/courses" },
  { section: "Learning Services", title: "Instructors", path: "/instructors", icon: Users },
  // Deliverables tab disabled for now as requested
  // { section: "Learning Services", title: "Deliveries", path: "/deliveries", icon: CalendarCheck },
  { section: "Admin", title: "Users", path: "/users", icon: ShieldCheck, adminOnly: true },
];
