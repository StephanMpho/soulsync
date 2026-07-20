"use client";

import { useId, useRef, useState } from "react";

export function PhotoPicker({ name = "photo" }: { name?: string }) {
  const inputId = useId();
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
      {/* Stays mounted regardless of preview state — swapping it out for
          the preview div (the previous bug) meant the selected file never
          made it into the form's data at submit time. */}
      <input ref={inputRef} id={inputId} type="file" name={name} accept="image/*" onChange={onChange} hidden />
      {previewUrl ? (
        <div className="ss-photo-preview-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="ss-photo-preview" />
          <button type="button" className="ss-photo-remove" onClick={clear} aria-label="Remove photo">
            ✕
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="ss-photo-add">
          📷 Add a photo (optional)
        </label>
      )}
    </div>
  );
}
