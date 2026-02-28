"use client";

import { useCallback, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type RemoteStorageService from "@/lib/remotestorage";

export function useDownloadAllData(
  storage: RemoteStorageService | null,
  userAddress: string | null
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");

  const downloadAllData = useCallback(async () => {
    if (!storage) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus("Scanning directories...");
    const client = storage.getClient();

    try {
      const zip = new JSZip();
      const filePaths: string[] = [];
      const collectPaths = async (path: string) => {
        const listing = await client.getListing(path);
        if (!listing) return;
        for (const itemName of Object.keys(listing)) {
          if (itemName === ".folder") continue;
          const itemPath = path + itemName;
          if (itemName.endsWith("/")) {
            await collectPaths(itemPath);
          } else {
            filePaths.push(itemPath);
          }
        }
      };
      await collectPaths("");
      const totalFiles = filePaths.length;
      setDownloadStatus(`Found ${totalFiles} files. Downloading...`);
      let completed = 0;
      const MAX_CONCURRENT = 10;
      for (let i = 0; i < filePaths.length; i += MAX_CONCURRENT) {
        const batch = filePaths.slice(i, i + MAX_CONCURRENT);
        await Promise.all(
          batch.map(async (itemPath) => {
            try {
              const fileData = await client.getFile(itemPath);
              if (fileData?.data) {
                const zipPath = itemPath.startsWith("/") ? itemPath.slice(1) : itemPath;
                zip.file(zipPath, fileData.data as ArrayBuffer);
              }
            } catch (e) {
              console.error("Failed to download", itemPath, e);
            }
            completed++;
            setDownloadProgress(Math.round((completed / totalFiles) * 100));
            setDownloadStatus(`Downloading: ${completed}/${totalFiles} files`);
          })
        );
      }
      setDownloadStatus("Creating zip file...");
      const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (meta) => setDownloadStatus(`Creating zip file: ${Math.round(meta.percent)}%`)
      );
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
      const filename = `${userAddress || "remotestorage"}_${timestamp}.zip`;
      saveAs(blob, filename);
      setDownloadStatus("Download complete!");
      setDownloadProgress(100);
      setTimeout(() => {
        setDownloadStatus("");
        setDownloadProgress(0);
      }, 3000);
    } catch (err) {
      console.error("Failed to download data:", err);
      setDownloadStatus("Download failed");
    } finally {
      setIsDownloading(false);
    }
  }, [storage, userAddress]);

  return { downloadAllData, isDownloading, downloadStatus, downloadProgress };
}
