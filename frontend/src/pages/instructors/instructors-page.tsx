import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteInstructor, useInstructors } from "@/hooks/use-instructors";
import type { Instructor } from "@/lib/types";
import { InstructorFormDialog } from "./instructor-form-dialog";
import { InstructorDetailDialog } from "./instructor-detail-dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

export default function InstructorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [viewing, setViewing] = useState<Instructor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Instructor | null>(null);
  const pageSize = 20;
  const deleteInstructor = useDeleteInstructor();

  const params = useMemo(() => ({ search: search || undefined, limit: pageSize, offset: page * pageSize }), [search, page]);
  const { data, isLoading } = useInstructors(params);

  const columns: DataTableColumn<Instructor>[] = [
    {
      id: "name",
      label: "Name & Contact",
      render: (i) => (
        <div>
          <span className="font-semibold text-fg-1 hover:text-primary transition-colors cursor-pointer">{i.name}</span>
          <span className="block text-[11px] text-muted-foreground">{i.email}</span>
        </div>
      ),
    },
    {
      id: "platform",
      label: "Platform",
      width: "140px",
      render: (i) => (
        <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-semibold text-fg-2">
          {i.platform || "—"}
        </span>
      ),
    },
    {
      id: "product",
      label: "Products & Can Teach",
      render: (i) => {
        const product = i.product;
        const skills = i.skills_products || i.courses_can_teach;
        return (
          <div className="max-w-xs">
            {product && <span className="font-medium text-xs text-fg-1 block">{product}</span>}
            {skills && (
              <span className="line-clamp-1 text-[11px] text-muted-foreground">
                {skills}
              </span>
            )}
            {!product && !skills && <span className="text-muted-foreground text-xs">—</span>}
          </div>
        );
      },
    },
    { id: "location", label: "Location", width: "130px", render: (i) => i.location ?? "—" },
    { id: "vendor", label: "Vendor", width: "110px", render: (i) => i.vendor ?? "—" },
    {
      id: "feedback_score",
      label: "Feedback",
      width: "90px",
      render: (i) =>
        i.feedback_score ? (
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {i.feedback_score} ★
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "actions",
      label: "",
      width: "100px",
      align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              setViewing(i);
              setDetailOpen(true);
            }}
            className="rounded-sm p-1.5 text-fg-3 hover:bg-accent hover:text-fg-1"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            title="Edit Instructor"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(i);
              setFormOpen(true);
            }}
            className="rounded-sm p-1.5 text-fg-3 hover:bg-accent hover:text-fg-1"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            title="Delete Instructor"
            onClick={(e) => {
              e.stopPropagation();
              setToDelete(i);
            }}
            className="rounded-sm p-1.5 text-fg-3 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <SurfaceHeader
        eyebrow="Instructor Repository"
        title="Instructors"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> New instructor
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[280px] max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
          <Input
            placeholder="Search name, platform, product, or courses can teach…"
            className="pl-8 text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data ?? []}
        getRowId={(i) => i.id}
        isLoading={isLoading}
        emptyMessage="No instructors found."
        onRowClick={(i) => {
          setViewing(i);
          setDetailOpen(true);
        }}
        page={page}
        hasNextPage={(data ?? []).length === pageSize}
        onPageChange={setPage}
      />

      <InstructorFormDialog open={formOpen} onOpenChange={setFormOpen} instructor={editing} />

      <InstructorDetailDialog
        instructor={viewing}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(inst) => {
          setEditing(inst);
          setFormOpen(true);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This permanently removes the instructor profile."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteInstructor.mutateAsync(toDelete.id);
            toast.success("Instructor deleted");
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}
