"use client";

import type { MouseEvent } from "react";

interface Props {
  id: string;
  imageUrl: string;
  style: string;
  isSelected: boolean;
  onSelect: () => void;
  onImageClick: () => void;
  isLocalSaved?: boolean;
  isCloudSaved?: boolean;
  isSavingCloud?: boolean;
  onSaveLocal?: (id: string) => void;
  onSaveCloud?: (id: string) => void;
}

export function ImageCard({
  id,
  imageUrl,
  style,
  isSelected,
  onSelect,
  onImageClick,
  isLocalSaved = false,
  isCloudSaved = false,
  isSavingCloud = false,
  onSaveLocal,
  onSaveCloud,
}: Props) {
  function handleDownload(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `mumin-${style}-${Date.now()}.png`;
    link.click();
  }

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300"
      style={{
        borderColor: isSelected ? "var(--teal-400)" : "var(--gray-200)",
        borderWidth: "2px",
        boxShadow: isSelected ? "var(--shadow-teal)" : "var(--shadow-sm)",
        background: "var(--bg-surface)",
      }}
      onClick={onImageClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onImageClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${style} image`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Ad image - ${style}`}
        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      <div
        className="pointer-events-none absolute inset-0 flex items-end opacity-0 transition-opacity duration-250 group-hover:pointer-events-auto group-hover:opacity-100"
        style={{ background: "linear-gradient(to top, rgba(26,22,19,0.82) 0%, rgba(26,22,19,0.15) 58%, transparent 78%)" }}
      >
        <div className="flex w-full items-center justify-between gap-2 p-3" onClick={(event) => event.stopPropagation()}>
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-500"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFF", backdropFilter: "blur(4px)", fontFamily: "var(--font-body)" }}
          >
            {style}
          </span>

          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md px-2.5 py-1 text-[11px] font-500"
              style={{ background: "rgba(255,255,255,0.15)", color: "#FFF", backdropFilter: "blur(4px)" }}
            >
              تحميل
            </button>

            {onSaveLocal && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSaveLocal(id);
                }}
                disabled={isLocalSaved}
                className="rounded-md px-2.5 py-1 text-[11px] font-500 disabled:opacity-50"
                style={{ background: isLocalSaved ? "rgba(58,155,122,0.3)" : "rgba(255,255,255,0.15)", color: "#FFF", backdropFilter: "blur(4px)" }}
              >
                {isLocalSaved ? "محفوظ" : "حفظ"}
              </button>
            )}

            {onSaveCloud && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSaveCloud(id);
                }}
                disabled={isCloudSaved || isSavingCloud}
                className="rounded-md px-2.5 py-1 text-[11px] font-500 disabled:opacity-50"
                style={{ background: isCloudSaved ? "rgba(58,155,122,0.3)" : "var(--navy-500)", color: "#FFF" }}
              >
                {isCloudSaved ? "سحابي" : isSavingCloud ? "..." : "سحابة"}
              </button>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect();
              }}
              className="rounded-md px-2.5 py-1 text-[11px] font-600"
              style={{ background: isSelected ? "var(--teal-400)" : "var(--coral-400)", color: "#FFF" }}
            >
              {isSelected ? "✓" : "اختر"}
            </button>
          </div>
        </div>
      </div>

      {isCloudSaved && (
        <div
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-700 animate-scale-in"
          style={{ background: "var(--teal-400)", color: "#FFF", fontFamily: "var(--font-body)", letterSpacing: "0.02em" }}
        >
          Cloud saved
        </div>
      )}

      {isSelected && (
        <div
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full animate-scale-in"
          style={{ background: "var(--teal-400)", boxShadow: "0 2px 8px rgba(58,155,122,0.4)" }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#FFF" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
