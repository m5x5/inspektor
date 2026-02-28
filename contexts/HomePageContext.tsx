"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRemoteStorage } from "@/contexts/RemoteStorageContext";
import type { StorageItem } from "@/lib/remotestorage";
import { toast } from "sonner";

type HomePageContextValue = {
  currentDirPath: string;
  listing: StorageItem[];
  loading: boolean;
  connected: boolean;
  connecting: boolean;
  storage: ReturnType<typeof useRemoteStorage>["storage"];
  showCreateFolder: boolean;
  setShowCreateFolder: (v: boolean) => void;
  showCreateFile: boolean;
  setShowCreateFile: (v: boolean) => void;
  folderActionsSheetOpen: boolean;
  setFolderActionsSheetOpen: (v: boolean) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFileContent: string;
  setNewFileContent: (v: string) => void;
  createFolder: () => Promise<void>;
  createFile: () => Promise<void>;
  handleUpload: () => void;
  loadListing: () => void;
  invalidateListing: (path: string) => void;
  refreshRootListing: () => Promise<void>;
  documents: StorageItem[];
  deleteAllInDir: () => void;
};

const HomePageContext = createContext<HomePageContextValue | null>(null);

export function HomePageProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path") ?? "/";
  const currentDirPath = pathParam.endsWith("/") ? pathParam : pathParam + "/";
  const {
    connected,
    connecting,
    storage,
    fetchListing,
    getCachedListing,
    invalidateListing: invalidateListingContext,
    refreshRootListing,
  } = useRemoteStorage();
  const [listing, setListing] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [folderActionsSheetOpen, setFolderActionsSheetOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  const loadListing = useCallback(async () => {
    if (!storage) return;
    const path = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
    const pathKey = path || "";
    const cached = getCachedListing(pathKey);
    if (cached) {
      setListing(cached);
      setLoading(false);
      fetchListing(pathKey).then((items) => setListing(items)).catch(() => {});
      return;
    }
    setLoading(true);
    try {
      const items = await fetchListing(pathKey);
      setListing(items);
    } catch (e) {
      console.error(e);
      setListing([]);
    } finally {
      setLoading(false);
    }
  }, [storage, currentDirPath, fetchListing, getCachedListing]);

  useEffect(() => {
    if (!storage) {
      setListing([]);
      setLoading(false);
      return;
    }
    loadListing();
  }, [storage, currentDirPath, connected, loadListing]);

  const createFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name || !storage) return;
    try {
      const path = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
      await storage.storeFile(path + name + "/.folder", "text/plain", "");
      setShowCreateFolder(false);
      setNewFolderName("");
      loadListing();
      if (!path) refreshRootListing();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create folder.");
    }
  }, [newFolderName, storage, currentDirPath, loadListing, refreshRootListing]);

  const createFile = useCallback(async () => {
    const name = newFileName.trim();
    if (!name || !storage) return;
    try {
      const path = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
      await storage.storeFile(path + name, "text/plain", newFileContent);
      setShowCreateFile(false);
      setNewFileName("");
      setNewFileContent("");
      loadListing();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create file.");
    }
  }, [newFileName, newFileContent, storage, currentDirPath, loadListing]);

  const handleUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files?.length || !storage) return;
      const path = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
      for (const file of Array.from(files)) {
        const buf = await file.arrayBuffer();
        await storage.storeFile(path + file.name, file.type || "application/octet-stream", buf);
      }
      invalidateListingContext(path || "");
      loadListing();
    };
    input.click();
  }, [storage, currentDirPath, invalidateListingContext, loadListing]);

  const documents = listing.filter((item) => !item.isFolder);
  const deleteAllInDir = useCallback(() => {
    if (!documents.length || !storage) return;
    const path = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
    Promise.all(documents.map((item) => storage.remove(item.path)))
      .then(() => {
        invalidateListingContext(path || "");
        loadListing();
        if (!path) refreshRootListing();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to delete.");
      });
  }, [documents, storage, currentDirPath, loadListing, refreshRootListing, invalidateListingContext]);

  const value: HomePageContextValue = {
    currentDirPath,
    listing,
    loading,
    connected,
    connecting,
    storage,
    showCreateFolder,
    setShowCreateFolder,
    showCreateFile,
    setShowCreateFile,
    folderActionsSheetOpen,
    setFolderActionsSheetOpen,
    newFolderName,
    setNewFolderName,
    newFileName,
    setNewFileName,
    newFileContent,
    setNewFileContent,
    createFolder,
    createFile,
    handleUpload,
    loadListing,
    invalidateListing: invalidateListingContext,
    refreshRootListing,
    documents,
    deleteAllInDir,
  };

  return (
    <HomePageContext.Provider value={value}>
      {children}
    </HomePageContext.Provider>
  );
}

export function useHomePage() {
  const ctx = useContext(HomePageContext);
  if (!ctx) throw new Error("useHomePage must be used within HomePageProvider");
  return ctx;
}
