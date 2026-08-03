import { Loader2Icon, UploadCloudIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ACCEPT_ATTRIBUTE, imageRejectionReason } from "../photo-constraints";

/**
 * Drag-and-drop / file-picker surface shared by both photo flows: staged
 * selection while creating a room type, and direct upload once it exists.
 * Rejected files are reported here so neither caller has to repeat the checks.
 */
export function PhotoDropzone({
  onFiles,
  busy = false,
  uploading = false,
}: {
  onFiles: (files: File[]) => void;
  busy?: boolean;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;

    const good: File[] = [];
    for (const file of files) {
      const reason = imageRejectionReason(file);
      if (reason) toast.error(reason);
      else good.push(file);
    }
    if (good.length > 0) onFiles(good);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center transition-colors",
        dragging && "border-brand bg-accent/50",
      )}
    >
      {uploading ? (
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <UploadCloudIcon className="size-5 text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground">Drag and drop photos, or</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        Choose files
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WEBP · up to 5 MB each
      </p>
    </div>
  );
}
