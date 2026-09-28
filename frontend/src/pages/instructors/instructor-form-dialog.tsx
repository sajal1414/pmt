import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateInstructor, useUpdateInstructor } from "@/hooks/use-instructors";
import { getErrorMessage } from "@/lib/api";
import type { Instructor } from "@/lib/types";
import { formatEnumLabel } from "@/components/shared/status-badge";

const TRAVEL_OPTIONS = ["can_travel", "virtual_only", "in_person_only", "both"];
const FIELD_CLASS = "text-xs font-medium text-fg-2";
const EMPTY = {
  name: "",
  email: "",
  location: "",
  travel_preference: "",
  vendor: "",
  platform: "",
  portfolio: "",
  product: "",
  skills_products: "",
  courses_can_teach: "",
  comments: "",
};

export function InstructorFormDialog({
  open,
  onOpenChange,
  instructor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}) {
  const createInstructor = useCreateInstructor();
  const updateInstructor = useUpdateInstructor();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (instructor) {
      setForm({
        name: instructor.name,
        email: instructor.email,
        location: instructor.location ?? "",
        travel_preference: instructor.travel_preference ?? "",
        vendor: instructor.vendor ?? "",
        platform: instructor.platform ?? "",
        portfolio: instructor.portfolio ?? "",
        product: instructor.product ?? "",
        skills_products: instructor.skills_products ?? "",
        courses_can_teach: instructor.courses_can_teach ?? "",
        comments: instructor.comments ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [instructor, open]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      if (instructor) {
        await updateInstructor.mutateAsync({ id: instructor.id, body: form as never });
        toast.success("Instructor updated");
      } else {
        await createInstructor.mutateAsync(form as never);
        toast.success("Instructor created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const pending = createInstructor.isPending || updateInstructor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{instructor ? "Edit instructor" : "New instructor"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Name *</label>
            <Input value={form.name} onChange={set("name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Email *</label>
            <Input value={form.email} onChange={set("email")} type="email" disabled={!!instructor} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Location</label>
            <Input value={form.location} onChange={set("location")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Travel preference</label>
            <Select value={form.travel_preference} onChange={set("travel_preference")}>
              <option value="">—</option>
              {TRAVEL_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Vendor</label>
            <Input value={form.vendor} onChange={set("vendor")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Platform</label>
            <Input value={form.platform} onChange={set("platform")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Portfolio</label>
            <Input value={form.portfolio} onChange={set("portfolio")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Product</label>
            <Input value={form.product} onChange={set("product")} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Skills / products</label>
            <Input value={form.skills_products} onChange={set("skills_products")} placeholder="watsonx Orchestrate, DataStage, ..." />
            <p className="text-xs text-muted-foreground">Comma-separated — this is what the search box on the Instructors list matches against.</p>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Courses can teach</label>
            <Input value={form.courses_can_teach} onChange={set("courses_can_teach")} placeholder="Course codes or names" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Comments</label>
            <textarea
              className="min-h-16 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
              value={form.comments}
              onChange={set("comments")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving…" : instructor ? "Save changes" : "Create instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
