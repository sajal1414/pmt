import { useEffect, useState } from "react";

// Viewport breakpoints — kept in sync with dd-ui-design. Pure helper so
// non-React callers (tests, derived selectors) can classify a width without
// the hook.
export type ResponsiveLayout = {
  width: number;
  isMobile: boolean;   // < 768
  isTablet: boolean;   // 768..1023
  isDesktop: boolean;  // ≥ 1024
};

export function classifyViewport(width: number): ResponsiveLayout {
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

function readWidth(): number {
  if (typeof window === "undefined") return 1280;
  return window.innerWidth;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(() =>
    classifyViewport(readWidth()),
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setLayout(classifyViewport(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return layout;
}
