import { useMemo, useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { useDeliveries } from "@/hooks/use-deliveries";
import { useAuthStore } from "@/stores/auth-store";
import type { Delivery } from "@/lib/types";
import { DeliveryFormDialog } from "./delivery-form-dialog";
import { DeliveryFeedbackDialog } from "./delivery-feedback-dialog";

export default function DeliveriesPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<number | null>(null);
  const pageSize = 20;

  const params = useMemo(() => ({ limit: pageSize, offset: page * pageSize }), [page]);
  const { data, isLoading } = useDeliveries(params);

  const columns: DataTableColumn<Delivery>[] = [
    { id: "student_name", label: "Student", render: (d) => d.student_name ?? "—" },
    { id: "company", label: "Company", width: "140px", render: (d) => d.company ?? "—" },
    { id: "course_name", label: "Course", render: (d) => d.course_name ?? "—" },
    { id: "modality", label: "Modality", width: "100px", render: (d) => d.modality ?? "—" },
    { id: "delivery_date", label: "Delivery Date", width: "120px", render: (d) => d.delivery_date ?? "—" },
    {
      id: "feedback",
      label: "",
      width: "90px",
      align: "right",
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFeedbackFor(d.id);
          }}
          className="rounded-sm p-1.5 text-fg-3 hover:bg-accent hover:text-fg-1"
          aria-label="View feedback"
        >
          <MessageSquare className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <SurfaceHeader
        eyebrow="Delivery Repository"
        title="Deliveries"
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" /> Record delivery
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        getRowId={(d) => d.id}
        isLoading={isLoading}
        emptyMessage="No deliveries recorded."
        page={page}
        hasNextPage={(data ?? []).length === pageSize}
        onPageChange={setPage}
      />

      {isAdmin && <DeliveryFormDialog open={formOpen} onOpenChange={setFormOpen} />}
      <DeliveryFeedbackDialog deliveryId={feedbackFor} open={feedbackFor !== null} onOpenChange={(open) => !open && setFeedbackFor(null)} />
    </div>
  );
}
