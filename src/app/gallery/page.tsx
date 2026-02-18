"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ImageGrid } from "@/components/ImageGrid";
import { createClient } from "@/lib/supabase/client";
import { mergeIntoLocalGallery, readLocalGalleryImages } from "@/lib/gallery-storage";
import { useAppContext } from "@/components/AppProvider";
import { GalleryImageItem } from "@/types";

type CloudImageRow = {
  id: string;
  style: string;
  image_url: string;
  created_at: string;
  generation_id: string;
};

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:");
}

export default function GalleryPage() {
  const ctx = useAppContext();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Skip fetch if gallery was already loaded and hasn't been invalidated
    if (ctx.galleryLoaded) return;

    async function loadGallery() {
      ctx.setGalleryLoading(true);
      ctx.setGalleryError("");

      try {
        const localImages = readLocalGalleryImages();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          ctx.setGalleryImages(localImages);
          ctx.setGalleryLoading(false);
          ctx.markGalleryLoaded();
          return;
        }

        const { data: cloudRows, error: cloudError } = await supabase
          .from("generated_images")
          .select("id, style, image_url, created_at, generation_id")
          .order("created_at", { ascending: false });

        if (cloudError) {
          throw cloudError;
        }

        const rows = (cloudRows ?? []) as CloudImageRow[];
        const storagePaths = rows
          .map((row) => row.image_url)
          .filter((path) => !isExternalUrl(path));

        const signedUrlByPath = new Map<string, string>();

        if (storagePaths.length > 0) {
          const chunkSize = 100;

          for (let start = 0; start < storagePaths.length; start += chunkSize) {
            const chunk = storagePaths.slice(start, start + chunkSize);
            const { data: signedRows, error: signedError } = await supabase.storage
              .from("generated-images")
              .createSignedUrls(chunk, 60 * 60);

            if (signedError) {
              throw signedError;
            }

            for (let i = 0; i < chunk.length; i += 1) {
              const path = chunk[i];
              const signedUrl = signedRows?.[i]?.signedUrl;
              if (signedUrl) {
                signedUrlByPath.set(path, signedUrl);
              }
            }
          }
        }

        const cloudImages: GalleryImageItem[] = [];

        rows.forEach((row) => {
          const url = isExternalUrl(row.image_url)
            ? row.image_url
            : signedUrlByPath.get(row.image_url);

          if (!url) {
            return;
          }

          cloudImages.push({
            id: `cloud-${row.id}`,
            style: row.style,
            url,
            createdAt: row.created_at,
            isLocalSaved: false,
            isCloudSaved: true,
            cloudImageId: row.id,
            cloudStoragePath: isExternalUrl(row.image_url) ? null : row.image_url,
            generationId: row.generation_id,
          });
        });

        const localByCloudId = new Map(
          localImages
            .filter((img) => img.cloudImageId)
            .map((img) => [img.cloudImageId as string, img])
        );

        const localByCloudPath = new Map(
          localImages
            .filter((img) => img.cloudStoragePath)
            .map((img) => [img.cloudStoragePath as string, img])
        );

        const merged = [...localImages];

        for (const cloudImage of cloudImages) {
          const matchedLocal =
            (cloudImage.cloudImageId
              ? localByCloudId.get(cloudImage.cloudImageId)
              : undefined) ||
            (cloudImage.cloudStoragePath
              ? localByCloudPath.get(cloudImage.cloudStoragePath)
              : undefined);

          if (matchedLocal) {
            matchedLocal.isCloudSaved = true;
            matchedLocal.cloudImageId =
              matchedLocal.cloudImageId || cloudImage.cloudImageId;
            matchedLocal.cloudStoragePath =
              matchedLocal.cloudStoragePath || cloudImage.cloudStoragePath;
            matchedLocal.generationId =
              matchedLocal.generationId || cloudImage.generationId;
            continue;
          }

          merged.push(cloudImage);
        }

        merged.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        mergeIntoLocalGallery(merged.filter((img) => img.isLocalSaved));

        ctx.setGalleryImages(merged);
      } catch (err) {
        ctx.setGalleryError(
          err instanceof Error ? err.message : "Failed to load gallery images."
        );
      } finally {
        ctx.setGalleryLoading(false);
        ctx.markGalleryLoaded();
      }
    }

    loadGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.galleryLoaded]);

  const images = ctx.galleryImages;
  const loading = ctx.galleryLoading;
  const error = ctx.galleryError;

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{
                background: "var(--coral-50)",
                color: "var(--coral-500)",
                fontFamily: "var(--font-body)",
              }}
            >
              03
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--gray-900)" }}>
              المعرض
            </h1>
          </div>
          <p className="text-sm mr-12" style={{ color: "var(--gray-500)" }}>
            جميع الصور المحلية والسحابية معروضة هنا
          </p>
        </div>
        <Link
          href="/images"
          className="btn-ghost rounded-xl px-5 py-2.5 text-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            ولّد صور إضافية
          </span>
        </Link>
      </div>

      {loading && (
        <div
          className="animate-scale-in rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--navy-50)",
            border: "1px solid var(--navy-100)",
            color: "var(--navy-500)",
          }}
        >
          جاري تحميل المعرض...
        </div>
      )}

      {error && (
        <div
          className="animate-scale-in rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(217,79,51,0.06)",
            border: "1px solid rgba(217,79,51,0.12)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && <ImageGrid images={images} />}
    </div>
  );
}
