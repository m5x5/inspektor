"use client";

import { useState } from "react";
import { FolderPlusIcon, FilePlusIcon, UploadIcon, TrashIcon, MoreVertical } from "lucide-react";
import { useHomePage } from "@/contexts/HomePageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export function HomeHeaderActions() {
  const {
    currentDirPath,
    showCreateFolder,
    setShowCreateFolder,
    showCreateFile,
    setShowCreateFile,
    setNewFolderName,
    setNewFileName,
    setNewFileContent,
    folderActionsSheetOpen,
    setFolderActionsSheetOpen,
    handleUpload,
    createFolder,
    createFile,
    deleteAllInDir,
    documents,
  } = useHomePage();
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

  return (
    <>
      <nav className="ml-auto md:col-start-3 md:ml-0 flex justify-end" aria-label="Directory actions">
        {/* Mobile: opens the Sheet */}
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          aria-label="Folder actions"
          onClick={() => setFolderActionsSheetOpen(true)}
        >
          <MoreVertical className="size-4" />
        </Button>

        {/* Desktop: dropdown with all actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="hidden md:flex" aria-label="Folder actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setShowCreateFolder(true); setNewFolderName(""); }}>
              <FolderPlusIcon className="size-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setShowCreateFile(true); setNewFileName(""); setNewFileContent(""); }}>
              <FilePlusIcon className="size-4" />
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUpload}>
              <UploadIcon className="size-4" />
              Upload
            </DropdownMenuItem>
            {documents.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteAllOpen(true)}>
                  <TrashIcon className="size-4" />
                  Delete all in directory
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <Sheet open={folderActionsSheetOpen} onOpenChange={setFolderActionsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-left pr-8">
              {currentDirPath === "/" ? "Home" : currentDirPath.replace(/\/$/, "").split("/").pop() || "Home"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setShowCreateFolder(true);
                setNewFolderName("");
                setFolderActionsSheetOpen(false);
              }}
            >
              <FolderPlusIcon className="size-4 mr-2" />
              New Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setShowCreateFile(true);
                setNewFileName("");
                setNewFileContent("");
                setFolderActionsSheetOpen(false);
              }}
            >
              <FilePlusIcon className="size-4 mr-2" />
              New File
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                handleUpload();
                setFolderActionsSheetOpen(false);
              }}
            >
              <UploadIcon className="size-4 mr-2" />
              Upload
            </Button>
            {documents.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setFolderActionsSheetOpen(false);
                  setConfirmDeleteAllOpen(true);
                }}
              >
                <TrashIcon className="size-4 mr-2" />
                Delete all in directory
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDeleteAllOpen} onOpenChange={setConfirmDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all files?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {documents.length} document{documents.length !== 1 ? "s" : ""} in the current directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteAllInDir}
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
