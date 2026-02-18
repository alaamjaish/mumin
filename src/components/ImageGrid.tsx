"use client";

import { useState } from "react";
import { ImageCard } from "./ImageCard";
import { ImageLightbox } from "./ImageLightbox";
import { AD_STYLES } from "@/lib/styles";
import { GalleryImageItem } from "@/types";

interface Props {
  images: GalleryImageItem[];
  onSaveLocal?: (id: string) => void;
  onSaveCloud?: (id: string) => void;
  onSaveAllLocal?: () => void;
  onSaveAllCloud?: () => void;
  cloudSavingIds?: Set<string>;
  isSavingAllLocal?: boolean;
  isSavingAllCloud?: boolean;
}

export function ImageGrid({
  images,
  onSaveLocal,
  onSaveCloud,
  onSaveAllLocal,
  onSaveAllCloud,
  cloudSavingIds,
  isSavingAllLocal = false,
  isSavingAllCloud = false,
}: Props) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const styles = [...new Set(images.map((img) => img.style))];
  const filtered =
    filterStyle === "all"
      ? images
      : images.filter((img) => img.style === filterStyle);

  const viewerImages = filtered.map((img) => ({
    id: img.id,
    url: img.url,
    style: getStyleLabel(img.style),
  }));

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

  // Count unsaved images
  const unsavedLocalCount = images.filter((img) => !img.isLocalSaved).length;
  const unsavedCloudCount = images.filter((img) => !img.isCloudSaved).length;

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
      {/* Save All buttons + Filter pills row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        {/* Save All buttons */}
        {(onSaveAllLocal || onSaveAllCloud) && (
          <div className="flex items-center gap-2.5">
            {onSaveAllLocal && (
              <button
                onClick={onSaveAllLocal}
                disabled={isSavingAllLocal || unsavedLocalCount === 0}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: unsavedLocalCount === 0 ? "var(--teal-50)" : "var(--bg-surface)",
                  color: unsavedLocalCount === 0 ? "var(--teal-500)" : "var(--gray-700)",
                  border: unsavedLocalCount === 0 ? "1.5px solid var(--teal-100)" : "1.5px solid var(--gray-200)",
                }}
                onMouseEnter={(e) => {
                  if (unsavedLocalCount > 0 && !isSavingAllLocal) {
                    e.currentTarget.style.borderColor = "var(--coral-300)";
                    e.currentTarget.style.background = "var(--coral-50)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = unsavedLocalCount === 0 ? "var(--teal-100)" : "var(--gray-200)";
                  e.currentTarget.style.background = unsavedLocalCount === 0 ? "var(--teal-50)" : "var(--bg-surface)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isSavingAllLocal ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" stroke="none" />
                  </svg>
                ) : unsavedLocalCount === 0 ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
                  </svg>
                )}
                {isSavingAllLocal
                  ? "جاري الحفظ..."
                  : unsavedLocalCount === 0
                    ? "تم الحفظ محلياً ✓"
                    : `حفظ الكل محلياً (${unsavedLocalCount})`}
              </button>
            )}

            {onSaveAllCloud && (
              <button
                onClick={onSaveAllCloud}
                disabled={isSavingAllCloud || unsavedCloudCount === 0}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: unsavedCloudCount === 0 ? "var(--teal-400)" : "var(--navy-500)",
                  color: "#FFF",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  if (unsavedCloudCount > 0 && !isSavingAllCloud) {
                    e.currentTarget.style.background = "var(--navy-400)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(44,62,107,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = unsavedCloudCount === 0 ? "var(--teal-400)" : "var(--navy-500)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {isSavingAllCloud ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" stroke="none" />
                  </svg>
                ) : unsavedCloudCount === 0 ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                )}
                {isSavingAllCloud
                  ? "جاري الرفع..."
                  : unsavedCloudCount === 0
                    ? "تم الرفع سحابياً ✓"
                    : `حفظ الكل سحابياً (${unsavedCloudCount})`}
              </button>
            )}
          </div>
        )}
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
              onImageClick={() => setViewerIndex(i)}
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

      {/* Image viewer */}
      {viewerIndex !== null && viewerImages[viewerIndex] && (
        <ImageLightbox
          images={viewerImages}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}
