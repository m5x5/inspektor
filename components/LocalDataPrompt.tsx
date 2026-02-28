"use client";

import { useState } from "react";
import { ArchiveIcon, FolderIcon, UploadIcon } from "lucide-react";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { useDownloadAllData } from "@/hooks/use-download-all-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LocalDataPrompt() {
  const { storage, userAddress, localDataSnapshot, clearLocalDataSnapshot } = useRemoteStorage();
  const { downloadAllData, isDownloading, downloadStatus, downloadProgress } = useDownloadAllData(
    storage,
    userAddress ?? "local"
  );
  const [exported, setExported] = useState(false);

  if (!localDataSnapshot) return null;

  const { folders, fileCount } = localDataSnapshot;
  const folderCount = folders.length;

  const handleExport = async () => {
    await downloadAllData();
    setExported(true);
  };

  const handleDismiss = () => {
    setExported(false);
    clearLocalDataSnapshot();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="size-5 text-amber-500" />
            You have local data
          </DialogTitle>
          <DialogDescription>
            You created files while offline. Remote sync may overwrite them — export a backup now so you can re-upload anything you want to keep.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-2">
          {folderCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {folders.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs font-medium"
                >
                  <FolderIcon className="size-3 text-muted-foreground" />
                  {f}
                </span>
              ))}
            </div>
          )}
          <p className="text-muted-foreground">
            {folderCount > 0 && fileCount > 0
              ? `${folderCount} folder${folderCount !== 1 ? "s" : ""} · ${fileCount} file${fileCount !== 1 ? "s" : ""}`
              : folderCount > 0
              ? `${folderCount} folder${folderCount !== 1 ? "s" : ""}`
              : `${fileCount} file${fileCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {exported && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-4 py-3 text-sm">
            <p className="font-medium text-green-800 dark:text-green-400">ZIP downloaded!</p>
            <p className="text-green-700 dark:text-green-500 mt-0.5">
              Go to <strong>Home</strong> and use the{" "}
              <UploadIcon className="inline size-3" /> upload button in any folder to
              restore what you need.
            </p>
          </div>
        )}

        {isDownloading && (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{downloadStatus}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {exported ? (
            <Button onClick={handleDismiss}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleDismiss} disabled={isDownloading}>
                Discard local data
              </Button>
              <Button onClick={handleExport} disabled={isDownloading}>
                <ArchiveIcon className="size-4" />
                {isDownloading ? "Exporting…" : "Export as ZIP"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
