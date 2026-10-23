import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useDeleteUser, useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/stores/auth-store";
import { getErrorMessage } from "@/lib/api";
import type { AppUser } from "@/lib/types";
import { UserFormDialog } from "./user-form-dialog";

export default function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AppUser | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const allUsers = data ?? [];
  const pagedUsers = allUsers.slice(page * pageSize, (page + 1) * pageSize);
  const hasNextPage = (page + 1) * pageSize < allUsers.length;

  const columns: DataTableColumn<AppUser>[] = [
    {
      id: "full_name",
      label: "Name",
      width: "240px",
      render: (u) => <span className="font-semibold text-fg-1">{u.full_name || "—"}</span>,
    },
    {
      id: "email",
      label: "Email",
      width: "280px",
      render: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      id: "role",
      label: "Role",
      width: "130px",
      render: (u) => <StatusBadge label={u.role === "admin" ? "Admin" : "Instructor"} tone={u.role === "admin" ? "gold" : "neutral"} />,
    },
    {
      id: "must_change_password",
      label: "Status",
      width: "160px",
      render: (u) => (u.must_change_password ? <StatusBadge label="Password pending" tone="warning" /> : <StatusBadge label="Active" tone="success" />),
    },
    {
      id: "actions",
      label: "",
      width: "90px",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(u);
              setFormOpen(true);
            }}
            className="rounded-sm p-1.5 text-fg-3 hover:bg-accent hover:text-fg-1"
          >
            <Pencil className="size-3.5" />
          </button>
          {u.id !== currentUserId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(u);
              }}
              className="rounded-sm p-1.5 text-fg-3 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <SurfaceHeader
        eyebrow="Admin"
        title="Users"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> New user
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={pagedUsers}
        getRowId={(u) => u.id}
        isLoading={isLoading}
        page={page}
        hasNextPage={hasNextPage}
        onPageChange={setPage}
        minWidth="900px"
        emptyMessage="No users found."
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete ${toDelete?.email}?`}
        description="This permanently removes their login. It does not delete any linked instructor profile."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteUser.mutateAsync(toDelete.id);
            toast.success("User deleted");
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
