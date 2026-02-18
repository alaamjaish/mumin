"use client";

import { useCallback, useEffect, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";

interface LightboxImage {
  id: string;
  url: string;
  style: string;
}

interface Props {
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: Props) {
  const [mounted, setMounted] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [hasPrev, onNavigate, currentIndex]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [hasNext, onNavigate, currentIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose, goPrev, goNext]);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setTouchEndX(null);
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    setTouchEndX(event.touches[0]?.clientX ?? null);
  }

  function onTouchEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const swipeDistance = touchStartX - touchEndX;
    const minSwipe = 40;

    if (swipeDistance > minSwipe) goNext();
    if (swipeDistance < -minSwipe) goPrev();
  }

  if (!mounted || !current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(17, 20, 26, 0.58)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[980px] overflow-hidden rounded-2xl border bg-white animate-scale-in"
        style={{ borderColor: "var(--gray-200)", boxShadow: "0 20px 70px rgba(0,0,0,0.28)" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        dir="ltr"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border"
          style={{ background: "rgba(255,255,255,0.95)", borderColor: "var(--gray-200)", color: "var(--gray-700)" }}
          aria-label="Close preview"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className="relative flex h-[68vh] min-h-[320px] max-h-[740px] items-center justify-center px-12 py-6 sm:px-16"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.style}
            className="max-h-full max-w-full rounded-xl object-contain select-none"
            draggable={false}
          />

          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-35 sm:left-4 sm:h-11 sm:w-11"
            style={{ background: "rgba(255,255,255,0.95)", borderColor: "var(--gray-200)", color: "var(--gray-700)" }}
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!hasNext}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-35 sm:right-4 sm:h-11 sm:w-11"
            style={{ background: "rgba(255,255,255,0.95)", borderColor: "var(--gray-200)", color: "var(--gray-700)" }}
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs sm:px-5"
          style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)", fontFamily: "var(--font-body)" }}
          dir="rtl"
        >
          <span
            className="rounded-full px-3 py-1 text-[11px] font-600"
            style={{
              background: "var(--gray-100)",
              color: "var(--gray-700)",
              maxWidth: "70%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {current.style}
          </span>
          <span>
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
