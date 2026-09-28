import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteInstructor, useInstructors } from "@/hooks/use-instructors";
import type { Instructor } from "@/lib/types";
import { InstructorFormDialog } from "./instructor-form-dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

export default function InstructorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Instructor | null>(null);
  const pageSize = 20;
  const deleteInstructor = useDeleteInstructor();

  const params = useMemo(() => ({ search: search || undefined, limit: pageSize, offset: page * pageSize }), [search, page]);
  const { data, isLoading } = useInstructors(params);

  const columns: DataTableColumn<Instructor>[] = [
    { id: "name", label: "Name", render: (i) => <span className="font-medium">{i.name}</span> },
    { id: "email", label: "Email", render: (i) => i.email },
    { id: "location", label: "Location", width: "140px", render: (i) => i.location ?? "—" },
    { id: "vendor", label: "Vendor", width: "120px", render: (i) => i.vendor ?? "—" },
    { id: "feedback_score", label: "Feedback", width: "90px", render: (i) => i.feedback_score ?? "—" },
    {
      id: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-1">
          <button
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

      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
        <Input
          placeholder="Search name or skills…"
          className="pl-8"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data ?? []}
        getRowId={(i) => i.id}
        isLoading={isLoading}
        emptyMessage="No instructors found."
        page={page}
        hasNextPage={(data ?? []).length === pageSize}
        onPageChange={setPage}
      />

      <InstructorFormDialog open={formOpen} onOpenChange={setFormOpen} instructor={editing} />

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
