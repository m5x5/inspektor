"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FolderIcon, UploadIcon } from "lucide-react";
import { DirectoryListing } from "@/components/DirectoryListing";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import type { StorageItem } from "@/lib/remotestorage";
import {
  getUploads,
  getDeviceName,
  type UploadRecord,
} from "@/lib/upload-tracker";

function uploadsToStorageItems(uploads: UploadRecord[]): StorageItem[] {
  return uploads.map((u) => ({
    name: u.name,
    type: u.type,
    isBinary: false,
    isFolder: false,
    size: u.size,
    path: u.path.startsWith("/") ? u.path : "/" + u.path,
    etag: null,
  }));
}

export function DashboardHome() {
  const { connected, connecting, rootListing } = useRemoteStorage();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    setUploads(getUploads());
    setDeviceName(getDeviceName());
  }, []);

  useEffect(() => {
    const onFocus = () => setUploads(getUploads());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const uploadItems = useMemo(() => uploadsToStorageItems(uploads), [uploads]);

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 text-center">
        <p className="text-muted-foreground">Connecting...</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 text-center">
        <FolderIcon className="size-12 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Connect to get started</h2>
        <p className="text-muted-foreground max-w-md">
          Connect your remoteStorage account to browse and inspect your data.
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Connect
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Recent uploads */}
      {uploads.length > 0 && (
        <section>
          <div className="px-4 md:px-6 pt-4 pb-2">
            <h2 className="text-lg font-semibold tracking-tight">Recent uploads</h2>
            <p className="text-sm text-muted-foreground">
              {deviceName} &mdash; {uploads.length} file{uploads.length !== 1 ? "s" : ""}
            </p>
          </div>
          <DirectoryListing items={uploadItems} />
        </section>
      )}

      {/* All files */}
      <section>
        <div className="px-4 md:px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold tracking-tight">All files</h2>
        </div>
        {!rootListing ? (
          <div className="px-4 md:px-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-4 px-2">
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : rootListing.length === 0 ? (
          <p className="px-4 md:px-6 text-sm text-muted-foreground">No files in your storage yet.</p>
        ) : (
          <DirectoryListing items={rootListing} />
        )}
      </section>
    </div>
  );
}
