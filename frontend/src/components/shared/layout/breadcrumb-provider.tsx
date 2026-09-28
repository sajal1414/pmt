import { useMemo, useState, type ReactNode } from "react";
import { BreadcrumbContext, type ExtraCrumb } from "./breadcrumb-context";

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [extraCrumbs, setExtraCrumbs] = useState<ExtraCrumb[]>([]);
  const value = useMemo(() => ({ extraCrumbs, setExtraCrumbs }), [extraCrumbs]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}
