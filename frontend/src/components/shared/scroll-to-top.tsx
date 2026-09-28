import { useLayoutEffect } from "react";
import { useLocation } from "react-router";

/**
 * Resets scroll to the top of the document whenever the route path changes.
 *
 * The app shell scrolls at the document level — `SidebarProvider` uses
 * `min-h-svh` (a minimum, not a fixed height), so nothing below it constrains
 * height enough to create an inner scroll container. React Router performs no
 * scroll restoration, so without this, navigating from a long page (e.g. the
 * Learn index) leaves the next page scrolled to the same offset — which the
 * browser clamps to the bottom on a shorter page. Keyed on `pathname` only, so
 * `?tab=`/`#hash` changes that intentionally preserve position are unaffected.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
