"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ImageGenerationForm } from "@/components/ImageGenerationForm";
import { ImageGrid } from "@/components/ImageGrid";
import { createClient } from "@/lib/supabase/client";
import { createDraftImage, upsertLocalGalleryImage } from "@/lib/gallery-storage";
import { useAppContext } from "@/components/AppProvider";
import { ApprovedTextContext, GalleryImageItem, TextGenerationOutput } from "@/types";

const DRAFT_IMAGES_SESSION_KEY = "mumin.generated.draft.images";
const APPROVED_TEXT_CONTEXT_KEY = "approvedTextContext";
const LEGACY_RUSSIAN_TEXT_KEY = "russianText";
const CLOUD_GENERATION_CACHE_KEY = "mumin.cloud.generation.cache";

function normalizeDraftImages(input: unknown): GalleryImageItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const now = new Date().toISOString();
  const normalized: GalleryImageItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const candidate = item as Partial<GalleryImageItem> & {
      style?: unknown;
      url?: unknown;
    };

    if (typeof candidate.style !== "string" || typeof candidate.url !== "string") {
      return;
    }

    const id =
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : `draft-${Date.now()}-${index}`;

    normalized.push({
      id,
      style: candidate.style,
      url: candidate.url,
      createdAt:
        typeof candidate.createdAt === "string" ? candidate.createdAt : now,
      isLocalSaved:
        typeof candidate.isLocalSaved === "boolean"
          ? candidate.isLocalSaved
          : false,
      isCloudSaved:
        typeof candidate.isCloudSaved === "boolean"
          ? candidate.isCloudSaved
          : false,
      cloudImageId:
        typeof candidate.cloudImageId === "string"
          ? candidate.cloudImageId
          : null,
      cloudStoragePath:
        typeof candidate.cloudStoragePath === "string"
          ? candidate.cloudStoragePath
          : null,
      generationId:
        typeof candidate.generationId === "string"
          ? candidate.generationId
          : null,
    });
  });

  return normalized;
}

function generationFingerprint(context: ApprovedTextContext) {
  return JSON.stringify(context);
}

export default function ImagesPage() {
  const ctx = useAppContext();

  const [cloudSavingIds, setCloudSavingIds] = useState<Set<string>>(new Set());
  const [cloudGenerationId, setCloudGenerationId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  // Hydrate from sessionStorage only once (first visit or hard refresh)
  useEffect(() => {
    if (ctx.imagesHydrated) return;

    const storedContextRaw = sessionStorage.getItem(APPROVED_TEXT_CONTEXT_KEY);
    if (storedContextRaw) {
      try {
        const parsed = JSON.parse(storedContextRaw) as ApprovedTextContext;
        if (parsed?.input && parsed?.approved) {
          ctx.setApprovedContext(parsed);
          ctx.setRussianText(parsed.approved);
        }
      } catch {
        // Ignore parse errors and fallback to legacy key.
      }
    }

    if (!storedContextRaw) {
      const legacy = sessionStorage.getItem(LEGACY_RUSSIAN_TEXT_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy) as TextGenerationOutput;
          ctx.setRussianText(parsed);
        } catch {
          // Ignore parse errors.
        }
      }
    }

    const draftRaw = sessionStorage.getItem(DRAFT_IMAGES_SESSION_KEY);
    if (draftRaw) {
      try {
        const parsed = JSON.parse(draftRaw);
        ctx.setDraftImages(normalizeDraftImages(parsed));
      } catch {
        ctx.setDraftImages([]);
      }
    }

    ctx.markImagesHydrated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const russianText = ctx.russianText;
  const approvedContext = ctx.approvedContext;
  const images = ctx.draftImages;
  const imagesRef = useRef<GalleryImageItem[]>(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  function persistDraftImages(nextImages: GalleryImageItem[]) {
    sessionStorage.setItem(DRAFT_IMAGES_SESSION_KEY, JSON.stringify(nextImages));
  }

  function updateImage(imageId: string, updater: (item: GalleryImageItem) => GalleryImageItem) {
    ctx.setDraftImages((prev) => {
      const next = prev.map((item) =>
        item.id === imageId ? updater(item) : item
      );
      persistDraftImages(next);
      return next;
    });
  }

  function handleImagesGenerated(newImages: { style: string; url: string }[]) {
    setSaveError("");
    const draftImages = newImages.map((img) => createDraftImage(img.style, img.url));
    ctx.setDraftImages((prev) => {
      const next = [...prev, ...draftImages];
      persistDraftImages(next);
      return next;
    });
    ctx.invalidateGallery();
  }

  function handleSaveLocal(imageId: string) {
    const target = imagesRef.current.find((img) => img.id === imageId);
    if (!target) {
      return;
    }

    const updated: GalleryImageItem = {
      ...target,
      isLocalSaved: true,
    };

    upsertLocalGalleryImage(updated);
    updateImage(imageId, () => updated);
    ctx.invalidateGallery();
  }

  async function ensureCloudGenerationId() {
    if (cloudGenerationId) {
      return cloudGenerationId;
    }

    if (!approvedContext) {
      throw new Error("No approved text context found. Generate and approve text first.");
    }

    const fingerprint = generationFingerprint(approvedContext);
    const cached = sessionStorage.getItem(CLOUD_GENERATION_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { id?: string; fingerprint?: string };
        if (parsed.id && parsed.fingerprint === fingerprint) {
          setCloudGenerationId(parsed.id);
          return parsed.id;
        }
      } catch {
        // Ignore parse errors and regenerate.
      }
    }

    const { data, error } = await supabase
      .from("generations")
      .insert({
        hook_ar: approvedContext.input.hook,
        offer_ar: approvedContext.input.offer,
        cta_ar: approvedContext.input.cta,
        hook_ru: approvedContext.approved.hook_ru,
        offer_ru: approvedContext.approved.offer_ru,
        cta_ru: approvedContext.approved.cta_ru,
        full_copy_ru: approvedContext.approved.full_copy_ru,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(error?.message || "Failed to create cloud generation record.");
    }

    setCloudGenerationId(data.id);
    sessionStorage.setItem(
      CLOUD_GENERATION_CACHE_KEY,
      JSON.stringify({ id: data.id, fingerprint })
    );

    return data.id;
  }

  async function handleSaveCloud(imageId: string) {
    const target = imagesRef.current.find((img) => img.id === imageId);
    if (!target || target.isCloudSaved) {
      return;
    }

    setSaveError("");
    setCloudSavingIds((prev) => new Set(prev).add(imageId));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in before saving images to cloud.");
      }

      const generationId = target.generationId || (await ensureCloudGenerationId());
      const blobResponse = await fetch(target.url);
      const blob = await blobResponse.blob();

      const mimeType = blob.type || "image/png";
      const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "png";
      const storagePath = `${user.id}/${generationId}/${target.id}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(storagePath, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload image to cloud storage.");
      }

      const { data, error: insertError } = await supabase
        .from("generated_images")
        .insert({
          generation_id: generationId,
          style: target.style,
          image_url: storagePath,
        })
        .select("id")
        .single();

      if (insertError || !data?.id) {
        throw new Error(insertError?.message || "Failed to save cloud image record.");
      }

      const updated: GalleryImageItem = {
        ...target,
        isLocalSaved: target.isLocalSaved,
        isCloudSaved: true,
        generationId,
        cloudImageId: data.id,
        cloudStoragePath: storagePath,
      };

      if (updated.isLocalSaved) {
        upsertLocalGalleryImage(updated);
      }
      updateImage(imageId, () => updated);
      ctx.invalidateGallery();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save image to cloud.");
    } finally {
      setCloudSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  }

  if (!russianText) {
    return (
      <div className="mx-auto max-w-md text-center animate-fade-in-up py-16">
        <div
          className="rounded-2xl px-8 py-16"
          style={{
            background: "var(--bg-surface)",
            border: "2px dashed var(--gray-200)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--gray-100)" }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="var(--gray-400)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="mb-1 text-base font-700" style={{ color: "var(--gray-700)" }}>
            لم يتم اعتماد نص روسي بعد
          </p>
          <p className="mb-6 text-sm" style={{ color: "var(--gray-400)" }}>
            يجب أولاً توليد واعتماد نص إعلاني روسي
          </p>
          <Link
            href="/generate"
            className="btn-gold inline-block rounded-xl px-8 py-3 text-sm"
          >
            <span>ارجع لتوليد النص</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Page header */}
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
            02
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-900)" }}>
            توليد الصور
          </h1>
        </div>
        <p className="text-sm mr-12" style={{ color: "var(--gray-500)" }}>
          اختر الستايلات وولّد صور إعلانية — احفظها محلياً أو على السحابة
        </p>
      </div>

      {/* Form card */}
      <div className="glass-card p-6 sm:p-8">
        <ImageGenerationForm
          russianText={russianText.full_copy_ru}
          onImagesGenerated={handleImagesGenerated}
        />
      </div>

      {/* Save errors */}
      {saveError && (
        <div
          className="animate-scale-in rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(217,79,51,0.06)",
            border: "1px solid rgba(217,79,51,0.12)",
            color: "var(--error)",
          }}
        >
          {saveError}
        </div>
      )}

      {/* Generated images */}
      {images.length > 0 && (
        <div className="animate-fade-in-up space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-1 rounded-full" style={{ background: "var(--navy-500)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-800)" }}>
                الصور المولدة ({images.length})
              </h2>
            </div>
            <Link
              href="/gallery"
              className="btn-teal rounded-xl px-5 py-2.5 text-sm"
            >
              انتقل للمعرض
            </Link>
          </div>
          <ImageGrid
            images={images}
            onSaveLocal={handleSaveLocal}
            onSaveCloud={handleSaveCloud}
            cloudSavingIds={cloudSavingIds}
          />
        </div>
      )}
    </div>
  );
}
