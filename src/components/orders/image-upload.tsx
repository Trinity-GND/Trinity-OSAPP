"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: Blob) {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Upload failed");
      onChange(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) upload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) upload(file);
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Product" className="w-24 h-24 object-cover rounded border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs px-2 py-1 rounded-md border border-border-warm bg-card hover:bg-cream"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          tabIndex={0}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-28 border-2 border-dashed rounded-md flex items-center justify-center text-xs text-muted cursor-pointer transition-colors ${
            dragOver ? "border-gold bg-cream" : "border-border-warm"
          }`}
        >
          {uploading ? "Uploading..." : "Click to upload, drag & drop, or paste (Ctrl+V)"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </div>
      )}
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
}
