import type { NavItem } from "@/config/navigation";

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.pathPrefix) {
    return pathname === item.pathPrefix || pathname.startsWith(item.pathPrefix + "/");
  }
  return pathname === item.path || pathname.startsWith(item.path + "/");
}
