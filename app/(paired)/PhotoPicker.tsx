"use client";

import { useRef, useState } from "react";

export function PhotoPicker({ name = "photo" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const clear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="ss-photo-picker">
      {previewUrl ? (
        <div className="ss-photo-preview-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="ss-photo-preview" />
          <button type="button" className="ss-photo-remove" onClick={clear} aria-label="Remove photo">
            ✕
          </button>
        </div>
      ) : (
        <label className="ss-photo-add">
          📷 Add a photo (optional)
          <input ref={inputRef} type="file" name={name} accept="image/*" onChange={onChange} hidden />
        </label>
      )}
    </div>
  );
}
