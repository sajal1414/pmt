import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface ImportResult {
  created: number;
  updated?: number;
  lessons_created?: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export function BulkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Choose a spreadsheet file first");
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // No explicit Content-Type — axios must set multipart/form-data with the boundary itself
      const res = await api.post<{ DATA: ImportResult }>("/v1/courses/import", formData);
      const data = res.data.DATA;

      queryClient.invalidateQueries({ queryKey: ["courses"] });

      if (data.errors.length === 0) {
        // Clean complete success: notify and automatically close dialog
        const parts: string[] = [];
        if (data.created > 0) parts.push(`${data.created} courses created`);
        if (data.updated && data.updated > 0) parts.push(`${data.updated} courses updated`);
        if (data.lessons_created && data.lessons_created > 0) parts.push(`${data.lessons_created} lessons added`);
        const msg = parts.length > 0 ? `Successfully imported: ${parts.join(", ")}!` : "Spreadsheet imported successfully!";
        toast.success(msg);
        setResult(null);
        setFile(null);
        onOpenChange(false);
      } else {
        // Has partial errors or skips: surface the report and let user inspect
        setResult(data);
        if (data.created > 0 || (data.updated && data.updated > 0)) {
          const lMsg = data.lessons_created ? ` and ${data.lessons_created} lessons` : "";
          const count = (data.created || 0) + (data.updated || 0);
          toast.success(`Processed ${count} courses${lMsg} (${data.skipped} skipped)`);
        } else {
          toast.error(`Import failed with ${data.errors.length} validation errors`);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setResult(null);
          setFile(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <span>Bulk Import Courses & Lessons</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Upload an enterprise course catalog spreadsheet (.xlsx). Supports multiple sheets for both <strong>Courses</strong> and <strong>Lessons/Classes</strong> with video links, attachments, and articles.
        </p>

        {/* Template Download Banner */}
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-fg-2">
            <Download className="size-4 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-fg-1">Sample Test Spreadsheet</div>
              <div className="text-[11px] text-muted-foreground">Courses + Lessons sheets with complete articles & links</div>
            </div>
          </div>
          <a
            href="/atlas_complete_bulk_import_with_lessons.xlsx"
            download="atlas_complete_bulk_import_with_lessons.xlsx"
            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <span>Download .xlsx</span>
          </a>
        </div>

        {/* File Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-fg-2">Choose Excel File (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
            className="dd-field w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm"
          />
          {file && (
            <p className="text-[11px] text-muted-foreground">
              Selected: <span className="font-mono text-fg-1">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Error / Partial Report */}
        {result && (
          <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-2 p-3.5 text-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> {result.created} courses {result.lessons_created ? `& ${result.lessons_created} lessons` : ""} created
              </span>
              {result.skipped > 0 && (
                <span className="text-amber-700 dark:text-amber-400">
                  {result.skipped} skipped
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-border-subtle bg-background p-2.5 text-xs text-muted-foreground">
                <div className="font-semibold text-destructive mb-1">Validation Warnings / Skipped Rows:</div>
                {result.errors.map((e, i) => (
                  <div key={i} className="border-t border-border-subtle py-1.5 first:border-t-0 font-mono text-[11px]">
                    <span className="font-bold text-fg-1">Row {e.row}:</span> {e.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose}>
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={importing || !file} className="gap-1.5 font-semibold">
              <Upload className="size-3.5" />
              <span>{importing ? "Importing…" : "Import Courses"}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
