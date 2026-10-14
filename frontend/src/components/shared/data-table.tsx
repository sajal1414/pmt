import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
}

/**
 * Mirrors dd-ui's shared DataTable look exactly (header band, row/pagination
 * spacing, font sizes, border colors) — see dd-ui `src/components/shared/data-table.tsx`.
 * Simplified for this app's needs: no column filters or visibility picker, and
 * pagination is prev/next only since the backend doesn't return a total count.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sortBy,
  sortOrder = "asc",
  onSortChange,
  page = 0,
  hasNextPage = false,
  onPageChange,
  isLoading = false,
  emptyMessage = "No results.",
  onRowClick,
  minWidth,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (columnId: string) => void;
  page?: number;
  /** True when the API returned a full page — there may be more rows past this one. */
  hasNextPage?: boolean;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  minWidth?: string;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-xs"
          style={minWidth ? { minWidth } : undefined}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.id} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-surface-2">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "border-b border-border-subtle px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.04em] whitespace-nowrap text-fg-3",
                    col.className,
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  <span
                    className={cn("inline-flex items-center gap-1", col.sortable && "cursor-pointer select-none")}
                    role={col.sortable ? "button" : undefined}
                    tabIndex={col.sortable ? 0 : undefined}
                    onClick={() => col.sortable && onSortChange?.(col.id)}
                  >
                    {col.label}
                    {col.sortable && (
                      <span aria-hidden className={cn("text-[10px]", sortBy === col.id ? "text-primary" : "text-fg-muted")}>
                        {sortBy === col.id ? (sortOrder === "asc" ? "▴" : "▾") : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border-subtle">
                  {columns.map((col) => (
                    <td key={col.id} className="px-2.5 py-1.5">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-xs text-fg-3">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn("border-t border-border-subtle transition-colors", onRowClick && "cursor-pointer hover:bg-accent")}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-2.5 py-1.5 align-middle text-fg-1",
                        col.className,
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex items-center gap-3.5 border-t border-border-subtle px-3 py-2 text-[11.5px] text-fg-2">
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
              className="rounded-[6px] border border-border px-2 py-1 font-mono text-[11.5px] font-semibold text-fg-2 disabled:cursor-default disabled:bg-transparent disabled:text-fg-muted"
            >
              ◂ Prev
            </button>
            <span className="px-1.5 font-mono">
              Page <strong className="text-fg-1">{page + 1}</strong>
            </span>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
              className="rounded-[6px] border border-border px-2 py-1 font-mono text-[11.5px] font-semibold text-fg-2 disabled:cursor-default disabled:bg-transparent disabled:text-fg-muted"
            >
              Next ▸
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
