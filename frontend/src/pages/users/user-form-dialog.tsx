import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { useInstructors } from "@/hooks/use-instructors";
import { getErrorMessage } from "@/lib/api";
import type { AppUser } from "@/lib/types";

const FIELD_CLASS = "text-xs font-medium text-fg-2";

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AppUser | null;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: instructors } = useInstructors({ limit: 200 });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("admin");
  const [instructorId, setInstructorId] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.full_name ?? "");
      setRole(user.role);
      setInstructorId(user.instructor_id ? String(user.instructor_id) : "");
      setPassword("");
    } else {
      setEmail("");
      setFullName("");
      setRole("admin");
      setInstructorId("");
      setPassword("");
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (role === "instructor" && !instructorId) {
      toast.error("Pick which instructor profile this login belongs to");
      return;
    }
    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          body: {
            full_name: fullName,
            role: role as "admin" | "instructor",
            instructor_id: role === "instructor" ? Number(instructorId) : null,
            ...(password ? { password } : {}),
          },
        });
        toast.success("User updated");
      } else {
        if (!email || !password) {
          toast.error("Email and password are required");
          return;
        }
        // Admin creation only — instructor logins are edited into existence later,
        // not created from this dialog (see the "keep only admin creation" note below).
        await createUser.mutateAsync({ email, password, full_name: fullName || undefined, role: "admin" });
        toast.success("User created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const pending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "New user"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Email *</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" disabled={!!user} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          {/* This dialog only ever creates admin logins — instructor logins are managed
              (role changed, instructor profile linked) by editing an existing user, not
              by creating one here. */}
          {user && (
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_CLASS}>Role *</label>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
              </Select>
            </div>
          )}
          {user && role === "instructor" && (
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_CLASS}>Instructor profile *</label>
              <Select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">Select…</option>
                {(instructors ?? []).map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.email})
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>
              {user ? "Reset password (leave blank to keep current)" : "Temporary password *"}
            </label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            <p className="text-xs text-muted-foreground">
              {user
                ? "Setting a new password here forces them to change it again on next login."
                : "They'll be required to set their own password the first time they sign in."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving…" : user ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
