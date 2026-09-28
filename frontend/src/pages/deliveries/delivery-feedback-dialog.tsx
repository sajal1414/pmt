import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateDeliveryFeedback, useDeliveryFeedback } from "@/hooks/use-deliveries";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function DeliveryFeedbackDialog({
  deliveryId,
  open,
  onOpenChange,
}: {
  deliveryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const { data: feedback } = useDeliveryFeedback(deliveryId ?? undefined);
  const createFeedback = useCreateDeliveryFeedback(deliveryId ?? 0);
  const [nps, setNps] = useState("");
  const [text, setText] = useState("");

  const handleAdd = async () => {
    try {
      await createFeedback.mutateAsync({ nps_score: nps ? Number(nps) : null, feedback_text: text || null });
      setNps("");
      setText("");
      toast.success("Feedback added");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery feedback</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {(feedback ?? []).length === 0 && <p className="text-sm text-muted-foreground">No feedback recorded yet.</p>}
          {(feedback ?? []).map((f) => (
            <div key={f.id} className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>NPS: {f.nps_score ?? "—"}</span>
              </div>
              {f.feedback_text && <p className="mt-1 text-sm">{f.feedback_text}</p>}
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Input placeholder="NPS score (0-10)" type="number" min={0} max={10} value={nps} onChange={(e) => setNps(e.target.value)} />
            <textarea
              placeholder="Feedback text"
              className="min-h-16 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isAdmin && (
            <Button onClick={handleAdd} disabled={createFeedback.isPending}>
              Add feedback
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
