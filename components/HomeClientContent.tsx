"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon, ListIcon, CodeIcon, EyeIcon, PencilIcon } from "lucide-react";
import { CreateFAB, type CreateFABAction } from "@/components/CreateFAB";
import { DirectoryListing } from "@/components/DirectoryListing";
import { FilePreview } from "@/components/FilePreview";
import { HomeHeaderActions } from "@/components/HomeHeaderActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomePage } from "@/contexts/HomePageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StorageItem } from "@/lib/remotestorage";

function DirectoryListSkeleton() {
  return (
    <ul className="list-none p-0 m-0 mb-24">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <li
          key={i}
          className="grid grid-cols-[auto_1fr] md:grid-cols-[3%_60%_10%_27%] gap-2 md:gap-0 py-4 px-4 md:px-6 items-center"
        >
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-32 min-w-0" />
          <Skeleton className="h-4 w-12 ml-2 hidden md:block" />
          <Skeleton className="h-4 w-16 hidden md:block" />
        </li>
      ))}
    </ul>
  );
}

export function HomeClientContent() {
  const {
    currentDirPath,
    listing,
    loading,
    showCreateFolder,
    setShowCreateFolder,
    showCreateFile,
    setShowCreateFile,
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
    invalidateListing,
    refreshRootListing,
    storage,
  } = useHomePage();

  const isMobile = useIsMobile();
  const [headerActionsTarget, setHeaderActionsTarget] = useState<Element | null>(null);
  const [selectedFile, setSelectedFile] = useState<StorageItem | null>(null);
  const [jsonShowTree, setJsonShowTree] = useState(true);
  const [jsonShowSource, setJsonShowSource] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<StorageItem | null>(null);

  // Mount the header-actions portal target (client-only to avoid hydration mismatches)
  useEffect(() => {
    setHeaderActionsTarget(document.getElementById("home-header-actions-slot"));
  }, []);

  // Clear selection when navigating to a different folder
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on path change
  useEffect(() => { setSelectedFile(null); }, [currentDirPath]);

  const showSkeleton = loading;

  const handleFABAction = (action: CreateFABAction) => {
    if (action === "folder") {
      setNewFolderName("");
      setShowCreateFolder(true);
    } else if (action === "file") {
      setNewFileName("");
      setNewFileContent("");
      setShowCreateFile(true);
    } else if (action === "upload") {
      handleUpload();
    }
  };

  const headerActionsPortal = headerActionsTarget
    ? createPortal(<HomeHeaderActions />, headerActionsTarget)
    : null;

  const pathKey = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");

  const handleFileClick = (item: StorageItem) => {
    if (isMobile) return; // let Link navigate on mobile
    setSelectedFile(item);
    setShowEditor(false);
    setJsonShowTree(true);
    setJsonShowSource(false);
  };

  const isJSON = selectedFile?.type === "application/json" ||
    selectedFile?.name?.endsWith(".json") || false;

  const dirListing = showSkeleton ? (
    <DirectoryListSkeleton />
  ) : listing.length > 0 ? (
    <DirectoryListing
      items={listing}
      selectedFilePath={selectedFile?.path ?? null}
      onFileClick={isMobile ? undefined : handleFileClick}
      onDeleteItem={(item) => {
        if (!storage) return;
        setPendingDeleteItem(item);
      }}
    />
  ) : (
    <p className="p-5 text-muted-foreground">No listing data available.</p>
  );

  return (
    <>
      {headerActionsPortal}
      <CreateFAB onAction={handleFABAction} />

      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder in the current directory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFile} onOpenChange={setShowCreateFile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create File</DialogTitle>
            <DialogDescription>Enter a name and optional content for the new file.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="File name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <textarea
              placeholder="File content (optional)"
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFile(false)}>Cancel</Button>
            <Button onClick={createFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listing: full-width when no file selected; always hidden when a file is selected (split pane has its own listing) */}
      <div className={selectedFile ? "hidden" : undefined}>
        {dirListing}
      </div>

      {selectedFile && (() => {
        const previewToolbar = (
          <div className="flex items-center gap-2 border-b px-4 py-2 shrink-0">
            <span className="truncate text-sm font-medium flex-1">{selectedFile.name}</span>
            {isJSON && (
              <>
                <Button
                  size="icon"
                  variant={jsonShowTree && !jsonShowSource ? "secondary" : "ghost"}
                  className="size-7"
                  title="JSON tree view"
                  onClick={() => { setJsonShowTree(true); setJsonShowSource(false); }}
                >
                  <ListIcon className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant={jsonShowSource ? "secondary" : "ghost"}
                  className="size-7"
                  title="JSON source view"
                  onClick={() => { setJsonShowSource(true); setJsonShowTree(false); }}
                >
                  <CodeIcon className="size-4" />
                </Button>
              </>
            )}
            {!selectedFile.isBinary && (
              <Button
                size="icon"
                variant={showEditor ? "secondary" : "ghost"}
                className="size-7"
                title={showEditor ? "Preview" : "Edit"}
                onClick={() => setShowEditor((v) => !v)}
              >
                {showEditor ? <EyeIcon className="size-4" /> : <PencilIcon className="size-4" />}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              title="Close preview"
              onClick={() => setSelectedFile(null)}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        );

        const previewContent = (
          <FilePreview
            metaData={{
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
              path: selectedFile.path,
              etag: selectedFile.etag ?? null,
              isBinary: selectedFile.isBinary,
            }}
            storage={storage}
            isJSON={isJSON}
            showEditor={showEditor}
            jsonShowTree={jsonShowTree}
            jsonShowSource={jsonShowSource}
            onToggleJsonTree={() => { setJsonShowTree((v) => !v); setJsonShowSource(false); }}
            onToggleJsonSource={() => { setJsonShowSource((v) => !v); setJsonShowTree(false); }}
            onShowEditor={() => setShowEditor(true)}
            onCancelEditor={() => setShowEditor(false)}
          />
        );

        return (
          <>
            {/* Narrow: full-width preview covering the content area */}
            <div className="flex flex-col @[900px]:hidden border-t">
              {previewToolbar}
              <div className="overflow-y-auto">{previewContent}</div>
            </div>

            {/* Wide: split pane — listing on left, preview on right */}
            {/* -mx-8 -mt-2 cancels outer padding so it fills edge-to-edge */}
            <div className="hidden @[900px]:flex h-[calc(100dvh-4rem)] -mx-8 -mt-2 overflow-hidden border-t">
              <div className="w-1/2 overflow-y-auto border-r shrink-0">
                {dirListing}
              </div>
              <div className="w-1/2 flex flex-col min-h-0 overflow-hidden">
                {previewToolbar}
                <div className="flex-1 overflow-y-auto">{previewContent}</div>
              </div>
            </div>
          </>
        );
      })()}

      <AlertDialog open={!!pendingDeleteItem} onOpenChange={(open) => { if (!open) setPendingDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &ldquo;{pendingDeleteItem?.name.replace(/\/$/, "")}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!storage || !pendingDeleteItem) return;
                await storage.remove(pendingDeleteItem.path);
                if (selectedFile?.path === pendingDeleteItem.path) setSelectedFile(null);
                const pathKey = currentDirPath === "/" ? "" : currentDirPath.replace(/^\//, "");
                invalidateListing(pathKey);
                loadListing();
                if (!currentDirPath || currentDirPath === "/") refreshRootListing();
                setPendingDeleteItem(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
