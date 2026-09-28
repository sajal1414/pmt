import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateDelivery } from "@/hooks/use-deliveries";
import { getErrorMessage } from "@/lib/api";
import { nullifyEmptyStrings } from "@/lib/utils";

const FIELD_CLASS = "text-xs font-medium text-fg-2";
const EMPTY = {
  student_name: "",
  student_email: "",
  company: "",
  role: "",
  location: "",
  modality: "",
  course_name: "",
  delivery_date: "",
};

export function DeliveryFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createDelivery = useCreateDelivery();
  const [form, setForm] = useState(EMPTY);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.student_name || !form.course_name) {
      toast.error("Student name and course name are required");
      return;
    }
    try {
      await createDelivery.mutateAsync(nullifyEmptyStrings(form) as never);
      toast.success("Delivery recorded");
      onOpenChange(false);
      setForm(EMPTY);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a delivery</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Student name *</label>
            <Input value={form.student_name} onChange={set("student_name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Student email</label>
            <Input value={form.student_email} onChange={set("student_email")} type="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Company</label>
            <Input value={form.company} onChange={set("company")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Role</label>
            <Input value={form.role} onChange={set("role")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Location</label>
            <Input value={form.location} onChange={set("location")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Modality</label>
            <Input value={form.modality} onChange={set("modality")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Course name *</label>
            <Input value={form.course_name} onChange={set("course_name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Delivery date</label>
            <Input value={form.delivery_date} onChange={set("delivery_date")} type="date" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createDelivery.isPending}>
            {createDelivery.isPending ? "Saving…" : "Record delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
