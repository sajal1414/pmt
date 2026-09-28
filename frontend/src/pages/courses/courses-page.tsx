import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Upload } from "lucide-react";
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

const COLUMNS: DataTableColumn<Course>[] = [
  { id: "nfolks_course_code", label: "Code", sortable: true, width: "120px", render: (c) => <span className="font-mono text-xs">{c.nfolks_course_code}</span> },
  { id: "course_name", label: "Course Name", sortable: true, render: (c) => <span className="font-medium">{c.course_name}</span> },
  { id: "vendor", label: "Vendor", width: "110px", render: (c) => c.vendor ?? "—" },
  { id: "platform", label: "Platform", width: "120px", render: (c) => c.platform ?? "—" },
  { id: "status", label: "Status", width: "130px", render: (c) => <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} /> },
  { id: "retire_date", label: "Retire Date", width: "120px", render: (c) => c.retire_date ?? "—" },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
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
      status: status || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: pageSize,
      offset: page * pageSize,
    }),
    [search, status, sortBy, sortOrder, page],
  );

  const { data, isLoading } = useCourses(params);

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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
          <Input
            placeholder="Search course name or description…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Select
          className="w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {formatEnumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data ?? []}
        getRowId={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No courses found."
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
