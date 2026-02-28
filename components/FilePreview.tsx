"use client";

/// <reference path="../types/pretty.d.ts" />
import { useEffect, useState, useCallback, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { JsonView, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import pretty from "pretty";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type RemoteStorageService from "@/lib/remotestorage";

type DocumentMetaData = {
  name: string;
  type: string;
  size: number | null;
  path: string;
  etag: string | null;
  isBinary?: boolean;
};

type FilePreviewProps = {
  metaData: DocumentMetaData;
  storage: RemoteStorageService | null;
  isJSON: boolean;
  showEditor: boolean;
  jsonShowTree: boolean;
  jsonShowSource: boolean;
  onToggleJsonTree: () => void;
  onToggleJsonSource: () => void;
  onShowEditor: () => void;
  onCancelEditor: () => void;
};

export function FilePreview({
  metaData,
  storage,
  isJSON,
  showEditor,
  jsonShowTree,
  jsonShowSource,
  onToggleJsonTree,
  onToggleJsonSource,
  onShowEditor,
  onCancelEditor,
}: FilePreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [editedJson, setEditedJson] = useState("");
  const [uploading, setUploading] = useState(false);

  const isImage = /^image\/.+/.test(metaData.type);
  const isAudio = /^audio\/.+/.test(metaData.type);
  const isVideo = /^video\/.+/.test(metaData.type);
  const isBinary = metaData.isBinary === true || metaData.type === "folder" || /charset=binary/.test(metaData.type);
  const isText = !isBinary;
  const isHTML =
    /html/i.test(metaData.type) ||
    metaData.name.endsWith(".html") ||
    metaData.name.endsWith(".htm");

  const prettyJson = useMemo(() => {
    if (!fileContent || !isJSON) return null;
    try {
      return JSON.stringify(JSON.parse(fileContent), null, 2);
    } catch {
      return fileContent;
    }
  }, [fileContent, isJSON]);

  const prettyHtml = useMemo(() => {
    if (!fileContent || !isHTML) return null;
    try {
      return pretty(fileContent);
    } catch {
      return fileContent;
    }
  }, [fileContent, isHTML]);

  useEffect(() => {
    if (!metaData.path || !storage) return;
    const path = metaData.path;

    if (isAudio || isVideo) {
      const url = storage.getItemURL(path);
      if (url) {
        setObjectURL(url);
        setLoaded(true);
      }
      return;
    }

    storage.getFile(path).then((file: { data: string | ArrayBuffer; contentType?: string }) => {
      if (!file) return;
      const data = file.data;
      if (isImage && data instanceof ArrayBuffer) {
        const blob = new Blob([data], { type: file.contentType || "application/octet-stream" });
        setObjectURL(URL.createObjectURL(blob));
      } else if (typeof data === "string") {
        setFileContent(data);
      } else if (data instanceof ArrayBuffer) {
        const dec = new TextDecoder();
        setFileContent(dec.decode(data));
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [metaData.path, storage, isImage, isAudio, isVideo]);

  const saveChanges = useCallback(() => {
    if (!storage || !isJSON) return;
    setUploading(true);
    storage.storeFile(metaData.path, "application/json", editedJson)
      .then(() => {
        setFileContent(editedJson);
        onCancelEditor();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to save.");
      })
      .finally(() => setUploading(false));
  }, [storage, metaData.path, isJSON, jsonShowTree, editedJson, onCancelEditor]);

  useEffect(() => {
    if (loaded && isJSON && fileContent) setEditedJson(JSON.stringify(JSON.parse(fileContent), null, 2));
  }, [loaded, isJSON, fileContent]);

  if (!loaded) return <p className="p-4">Loading…</p>;

  if (isBinary) {
    if (isImage && objectURL) {
      return <img src={objectURL} alt={metaData.name} className="max-w-full h-auto" />;
    }
    if (isAudio && objectURL) {
      return <audio src={objectURL} controls className="w-full" />;
    }
    if (isVideo && objectURL) {
      return <video src={objectURL} controls className="max-w-full" />;
    }
    return <p>No preview available for this content type.</p>;
  }

  if (isText) {
    if (isJSON && (jsonShowTree || jsonShowSource)) {
      let parsed: unknown = null;
      try {
        parsed = fileContent ? JSON.parse(fileContent) : null;
      } catch {
        // ignore
      }
      if (showEditor) {
        return (
          <div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={saveChanges} disabled={uploading}>
                Save changes
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEditor} disabled={uploading}>
                Cancel editing
              </Button>
            </div>
            <textarea
              className="flex min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[1rem] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              spellCheck={false}
            />
          </div>
        );
      }
      if (jsonShowTree && parsed !== null && typeof parsed === "object") {
        return (
          <div id="json-tree-view" className="overflow-auto text-[1rem]">
            <JsonView data={parsed as object} shouldExpandNode={(l) => l < 2} style={defaultStyles} />
          </div>
        );
      }
      return (
        <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
          <SyntaxHighlighter language="json" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
            {prettyJson ?? fileContent ?? ""}
          </SyntaxHighlighter>
        </div>
      );
    }
    if (isHTML && prettyHtml) {
      return (
        <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
          <SyntaxHighlighter language="html" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
            {prettyHtml}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <div className="overflow-auto rounded-md text-[0.9rem] [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&>div]:!whitespace-pre-wrap [&>div]:!break-words">
        <SyntaxHighlighter language="plaintext" style={oneLight} showLineNumbers PreTag="div" customStyle={{ margin: 0 }}>
          {fileContent ?? ""}
        </SyntaxHighlighter>
      </div>
    );
  }

  return null;
}
