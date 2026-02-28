"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileIcon, FolderIcon, ShareIcon } from "lucide-react";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import { humanFileSize } from "@/lib/human-file-size";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Must stay in sync with sw.js constants
const SHARE_DB_NAME = "inspektor-shares";
const SHARE_DB_VERSION = 1;
const SHARE_STORE = "pending-files";

type ShareEntry = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  receivedAt: number;
};

// ── IDB helpers ────────────────────────────────────────────────────────────

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(SHARE_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllShares(db: IDBDatabase): Promise<ShareEntry[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(SHARE_STORE, "readonly").objectStore(SHARE_STORE).getAll();
    req.onsuccess = () => resolve(req.result as ShareEntry[]);
    req.onerror = () => reject(req.error);
  });
}

function deleteShare(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE, "readwrite");
    tx.objectStore(SHARE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function clearAllShares(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE, "readwrite");
    tx.objectStore(SHARE_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export function ShareReceiver() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { storage, rootListing } = useRemoteStorage();

  const [pendingFiles, setPendingFiles] = useState<ShareEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState("");
  const [saving, setSaving] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const db = await openShareDB();
      dbRef.current = db;
      const entries = await getAllShares(db);
      if (entries.length > 0) {
        setPendingFiles(entries);
        setOpen(true);
      }
    } catch (err) {
      console.error("[ShareReceiver] IDB error", err);
    }
  }, []);

  // Check on first mount and whenever the SW redirects with ?share=1
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional on searchParams change
  useEffect(() => {
    loadPending();
  }, [loadPending, searchParams]);

  // Default target folder to the first root folder (if any)
  useEffect(() => {
    if (open && targetFolder === "" && rootListing && rootListing.length > 0) {
      const firstFolder = rootListing.find((i) => i.isFolder);
      setTargetFolder(firstFolder ? firstFolder.name.replace(/\/$/, "") : "");
    }
  }, [open, rootListing, targetFolder]);

  const handleSave = async () => {
    if (!storage || pendingFiles.length === 0) return;
    setSaving(true);

    const prefix = targetFolder ? `${targetFolder}/` : "";
    let saved = 0;

    try {
      const db = dbRef.current ?? (await openShareDB());
      for (const file of pendingFiles) {
        try {
          await storage.storeFile(`${prefix}${file.name}`, file.type, file.data);
          await deleteShare(db, file.id);
          saved++;
        } catch (err) {
          console.error("[ShareReceiver] Failed to save", file.name, err);
        }
      }
      toast.success(
        saved === pendingFiles.length
          ? `${saved} file${saved !== 1 ? "s" : ""} saved to ${prefix || "root"}`
          : `${saved} of ${pendingFiles.length} files saved`
      );
    } catch (err) {
      toast.error("Failed to save shared files.");
      console.error(err);
    } finally {
      setSaving(false);
      setPendingFiles([]);
      setOpen(false);
      // Strip the ?share=1 param so a refresh doesn't re-trigger
      router.replace("/");
    }
  };

  const handleDiscard = async () => {
    try {
      const db = dbRef.current ?? (await openShareDB());
      await clearAllShares(db);
    } catch {
      // ignore
    }
    setPendingFiles([]);
    setOpen(false);
    router.replace("/");
  };

  const folders = (rootListing ?? []).filter((i) => i.isFolder).map((i) => i.name.replace(/\/$/, ""));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDiscard(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="size-5 text-primary" />
            Save shared {pendingFiles.length === 1 ? "file" : "files"}
          </DialogTitle>
          <DialogDescription>
            Choose a folder, then save the file{pendingFiles.length !== 1 ? "s" : ""} to your storage.
          </DialogDescription>
        </DialogHeader>

        {/* File list */}
        <ul className="rounded-md border divide-y text-sm max-h-48 overflow-y-auto">
          {pendingFiles.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2">
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium">{f.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{humanFileSize(f.size)}</span>
            </li>
          ))}
        </ul>

        {/* Destination picker */}
        <div className="space-y-1.5">
          <label htmlFor="share-folder" className="text-sm font-medium">
            Save to
          </label>
          <div className="relative">
            <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <select
              id="share-folder"
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              className="w-full appearance-none rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Root</option>
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDiscard} disabled={saving}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={saving || !storage}>
            {saving ? "Saving…" : `Save to ${targetFolder || "root"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
