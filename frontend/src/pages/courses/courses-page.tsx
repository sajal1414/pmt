import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Upload, X } from "lucide-react";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/use-courses";
import { useAuthStore } from "@/stores/auth-store";
import type { Course } from "@/lib/types";
import { CourseFormDialog } from "./course-form-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";

const STATUS_OPTIONS = ["backlog", "pipeline", "draft", "in_progress", "for_review", "updated_version", "custom", "published"];

const PLATFORM_OPTIONS = [
  "Security",
  "Cloud",
  "Data & AI",
  "Automation",
  "Integration",
  "Infrastructure",
];

const COLUMNS: DataTableColumn<Course>[] = [
  {
    id: "nfolks_course_code",
    label: "Code",
    sortable: true,
    width: "125px",
    render: (c) => <span className="font-mono text-xs font-semibold text-primary">{c.nfolks_course_code}</span>,
  },
  {
    id: "course_name",
    label: "Course Name",
    sortable: true,
    render: (c) => (
      <div>
        <span className="font-medium text-fg-1 leading-snug">{c.course_name}</span>
        {c.ibm_course_codes && (
          <span className="block text-[11px] font-mono text-muted-foreground">IBM: {c.ibm_course_codes}</span>
        )}
      </div>
    ),
  },
  { id: "vendor", label: "Vendor", width: "100px", sortable: true, render: (c) => c.vendor ?? "—" },
  {
    id: "platform",
    label: "Platform",
    width: "120px",
    sortable: true,
    render: (c) => (
      <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-medium text-fg-2">
        {c.platform ?? "—"}
      </span>
    ),
  },
  {
    id: "product",
    label: "Product",
    width: "140px",
    sortable: true,
    render: (c) => <span className="text-xs text-fg-2 font-medium">{c.product ?? "—"}</span>,
  },
  {
    id: "status",
    label: "Status",
    width: "130px",
    sortable: true,
    render: (c) => <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} />,
  },
  {
    id: "created_at",
    label: "Create Date",
    width: "115px",
    sortable: true,
    render: (c) => (
      <span className="font-mono text-xs text-muted-foreground">
        {c.created_at ? new Date(c.created_at).toISOString().split("T")[0] : "—"}
      </span>
    ),
  },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const pageSize = 20;

  const params = useMemo(
    () => ({
      search: search || undefined,
      platform: platform || undefined,
      product: product || undefined,
      status: status || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: pageSize,
      offset: page * pageSize,
    }),
    [search, platform, product, status, sortBy, sortOrder, page],
  );

  const { data, isLoading } = useCourses(params);

  const hasActiveFilters = Boolean(search || platform || product || status);
  const clearFilters = () => {
    setSearch("");
    setPlatform("");
    setProduct("");
    setStatus("");
    setPage(0);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <SurfaceHeader
        eyebrow="Course Repository"
        title="Courses"
        actions={
          <>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" /> Bulk import
              </Button>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New course
            </Button>
          </>
        }
      />

      {/* Heading Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
          <Input
            placeholder="Search code, name, IBM code…"
            className="pl-8 text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {/* Filter on Headings: Platform */}
        <div className="w-36">
          <Select
            className="text-xs"
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Platforms</option>
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter on Headings: Product */}
        <div className="w-40">
          <Input
            placeholder="Filter Product…"
            className="text-xs"
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {/* Filter on Headings: Status */}
        <div className="w-36">
          <Select
            className="text-xs"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="h-9 text-xs text-muted-foreground hover:text-fg-1"
          >
            <X className="size-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data ?? []}
        getRowId={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No courses found matching your filter criteria."
        onRowClick={(c) => navigate(`/courses/${c.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(colId) => {
          if (colId === sortBy) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
          } else {
            setSortBy(colId);
            setSortOrder("asc");
          }
        }}
        page={page}
        hasNextPage={(data ?? []).length === pageSize}
        onPageChange={setPage}
      />

      <CourseFormDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(course) => navigate(`/courses/${course.id}`)} />
      {isAdmin && <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />}
    </div>
  );
}
