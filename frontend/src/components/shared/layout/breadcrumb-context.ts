import { createContext } from "react";

export interface ExtraCrumb {
  label: string;
  path?: string;
}

export interface BreadcrumbContextValue {
  extraCrumbs: ExtraCrumb[];
  setExtraCrumbs: (crumbs: ExtraCrumb[]) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);
