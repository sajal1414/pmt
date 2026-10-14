import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateCourse } from "@/hooks/use-course-mutations";
import { getErrorMessage } from "@/lib/api";
import { nullifyEmptyStrings } from "@/lib/utils";
import type { Course } from "@/lib/types";
import { formatEnumLabel } from "@/components/shared/status-badge";

const STATUS_OPTIONS = [
  "available",
  "in_development",
  "backlog",
  "pipeline",
  "draft",
  "in_progress",
  "for_review",
  "updated_version",
  "custom",
  "published",
  "lockheed",
  "retired",
];

const FIELD_CLASS = "text-xs font-medium text-fg-2";

export function CourseFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (course: Course) => void;
}) {
  const createCourse = useCreateCourse();
  const [form, setForm] = useState({
    course_name: "",
    nfolks_course_code: "",
    vendor: "",
    platform: "",
    portfolio: "",
    product: "",
    status: "available",
    modality: "",
    course_author_email: "",
    course_description: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.course_name || !form.nfolks_course_code) {
      toast.error("Course name and course code are required");
      return;
    }
    try {
      const course = await createCourse.mutateAsync(nullifyEmptyStrings(form) as never);
      toast.success("Course created");
      onOpenChange(false);
      setForm({ ...form, course_name: "", nfolks_course_code: "" });
      onCreated(course);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New course</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Course name *</label>
            <Input value={form.course_name} onChange={set("course_name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Course code *</label>
            <Input value={form.nfolks_course_code} onChange={set("nfolks_course_code")} placeholder="HAZ-AT-001" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Status</label>
            <Select value={form.status} onChange={set("status")}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {formatEnumLabel(s)}
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
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Modality</label>
            <Input value={form.modality} onChange={set("modality")} placeholder="ILT" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Course author email</label>
            <Input value={form.course_author_email} onChange={set("course_author_email")} type="email" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Description</label>
            <textarea
              className="min-h-20 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
              value={form.course_description}
              onChange={set("course_description")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createCourse.isPending}>
            {createCourse.isPending ? "Creating…" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
