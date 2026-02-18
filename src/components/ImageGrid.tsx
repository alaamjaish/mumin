"use client";

import { useState } from "react";
import { ImageCard } from "./ImageCard";
import { AD_STYLES } from "@/lib/styles";
import { GalleryImageItem } from "@/types";

interface Props {
  images: GalleryImageItem[];
  onSaveLocal?: (id: string) => void;
  onSaveCloud?: (id: string) => void;
  cloudSavingIds?: Set<string>;
}

export function ImageGrid({
  images,
  onSaveLocal,
  onSaveCloud,
  cloudSavingIds,
}: Props) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [filterStyle, setFilterStyle] = useState<string>("all");

  const styles = [...new Set(images.map((img) => img.style))];
  const filtered =
    filterStyle === "all"
      ? images
      : images.filter((img) => img.style === filterStyle);

  function toggleSelect(id: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getStyleLabel(styleId: string) {
    return AD_STYLES.find((s) => s.id === styleId)?.name || styleId;
  }

  if (images.length === 0) {
    return (
      <div
        className="rounded-2xl py-20 text-center"
        style={{
          border: "2px dashed var(--gray-200)",
          background: "var(--bg-surface)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--gray-100)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--gray-400)" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          لم يتم توليد أو حفظ صور بعد
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterStyle("all")}
          className="rounded-full px-4 py-1.5 text-xs font-600 transition-all duration-250"
          style={{
            background: filterStyle === "all" ? "var(--coral-400)" : "var(--bg-surface)",
            color: filterStyle === "all" ? "#FFF" : "var(--gray-500)",
            border: filterStyle === "all" ? "1.5px solid var(--coral-400)" : "1.5px solid var(--gray-200)",
            fontFamily: "var(--font-body)",
          }}
        >
          الكل ({images.length})
        </button>
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => setFilterStyle(style)}
            className="rounded-full px-4 py-1.5 text-xs font-600 transition-all duration-250"
            style={{
              background: filterStyle === style ? "var(--coral-400)" : "var(--bg-surface)",
              color: filterStyle === style ? "#FFF" : "var(--gray-500)",
              border: filterStyle === style ? "1.5px solid var(--coral-400)" : "1.5px solid var(--gray-200)",
              fontFamily: "var(--font-body)",
            }}
          >
            {getStyleLabel(style)} ({images.filter((img) => img.style === style).length})
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((img, i) => (
          <div
            key={img.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
          >
            <ImageCard
              id={img.id}
              imageUrl={img.url}
              style={getStyleLabel(img.style)}
              isSelected={selectedImages.has(img.id)}
              onSelect={() => toggleSelect(img.id)}
              isLocalSaved={img.isLocalSaved}
              isCloudSaved={img.isCloudSaved}
              isSavingCloud={Boolean(cloudSavingIds?.has(img.id))}
              onSaveLocal={onSaveLocal}
              onSaveCloud={onSaveCloud}
            />
          </div>
        ))}
      </div>

      {/* Selection counter */}
      {selectedImages.size > 0 && (
        <div
          className="animate-scale-in rounded-xl p-3.5 text-center"
          style={{
            background: "var(--teal-50)",
            border: "1px solid var(--teal-100)",
          }}
        >
          <p className="flex items-center justify-center gap-2 text-sm font-600" style={{ color: "var(--teal-500)" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تم تحديد {selectedImages.size} صورة
          </p>
        </div>
      )}
    </div>
  );
}
