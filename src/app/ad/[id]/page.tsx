"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/components/AppProvider";
import { TextGenerationForm } from "@/components/TextGenerationForm";
import { RussianTextOutput } from "@/components/RussianTextOutput";
import { ImageGenerationForm } from "@/components/ImageGenerationForm";
import { ImageGrid } from "@/components/ImageGrid";
import { CopyHistorySidebar } from "@/components/CopyHistorySidebar";
import {
  fetchAd,
  fetchCopyBatches,
  createCopyBatch,
  approveCopy,
  getApprovedCopy,
  fetchAdImages,
  updateAdImageInstructions,
  saveImageToCloud,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { upsertLocalGalleryImage } from "@/lib/gallery-storage";
import type { Ad, AdCopyBatch, TextGenerationInput, TextGenerationOutput, GalleryImageItem } from "@/types";

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:");
}

export default function AdPage() {
  const params = useParams();
  const adId = params.id as string;
  const router = useRouter();
  const { user, userLoading, russianInstructions, globalImageInstructions, invalidateGallery } = useAppContext();

  // Ad state
  const [ad, setAd] = useState<Ad | null>(null);
  const [batches, setBatches] = useState<AdCopyBatch[]>([]);
  const [currentResults, setCurrentResults] = useState<TextGenerationOutput[]>([]);
  const [currentInput, setCurrentInput] = useState<TextGenerationInput | null>(null);
  const [approvedBatchId, setApprovedBatchId] = useState<string | null>(null);
  const [approvedCopyIndex, setApprovedCopyIndex] = useState<number | null>(null);
  const [approvedCopy, setApprovedCopy] = useState<TextGenerationOutput | null>(null);

  // Image state
  const [adImages, setAdImages] = useState<GalleryImageItem[]>([]);
  const [imageInstructions, setImageInstructions] = useState("");
  const [overrideGlobal, setOverrideGlobal] = useState(false);
  const [cloudSavingIds, setCloudSavingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState("");
  const [isSavingAllLocal, setIsSavingAllLocal] = useState(false);
  const [isSavingAllCloud, setIsSavingAllCloud] = useState(false);

  // Loading
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const imagesRef = useRef<GalleryImageItem[]>(adImages);
  useEffect(() => { imagesRef.current = adImages; }, [adImages]);

  const loadAdData = useCallback(async () => {
    setPageLoading(true);
    setPageError("");
    try {
      const [adData, batchData, approved, imageRows] = await Promise.all([
        fetchAd(adId),
        fetchCopyBatches(adId),
        getApprovedCopy(adId),
        fetchAdImages(adId),
      ]);

      setAd(adData);
      setBatches(batchData);
      setImageInstructions(adData.image_instructions ?? "");
      setOverrideGlobal(adData.override_global_image_instructions);

      if (approved) {
        setApprovedCopy(approved.copy);
        setApprovedBatchId(approved.batchId);
        // Find the approved batch to get the index
        const approvedBatch = batchData.find(b => b.id === approved.batchId);
        if (approvedBatch) {
          setApprovedCopyIndex(approvedBatch.approved_copy_index);
        }
      }

      // Populate form from last batch if available
      if (batchData.length > 0) {
        const lastBatch = batchData[0];
        setCurrentInput({
          hook: lastBatch.hook_ar,
          offer: lastBatch.offer_ar,
          cta: lastBatch.cta_ar,
        });
      }

      // Process images
      const storagePaths = imageRows
        .map((row: { image_url: string }) => row.image_url)
        .filter((path: string) => !isExternalUrl(path));

      const signedUrlByPath = new Map<string, string>();
      if (storagePaths.length > 0) {
        const supabase = createClient();
        const { data: signedRows } = await supabase.storage
          .from("generated-images")
          .createSignedUrls(storagePaths, 60 * 60);
        if (signedRows) {
          storagePaths.forEach((path: string, i: number) => {
            const signedUrl = signedRows[i]?.signedUrl;
            if (signedUrl) signedUrlByPath.set(path, signedUrl);
          });
        }
      }

      const gallery: GalleryImageItem[] = imageRows.map((row: { id: string; style: string; image_url: string; created_at: string; generation_id: string }) => ({
        id: `cloud-${row.id}`,
        style: row.style,
        url: isExternalUrl(row.image_url) ? row.image_url : (signedUrlByPath.get(row.image_url) ?? row.image_url),
        createdAt: row.created_at,
        isLocalSaved: false,
        isCloudSaved: true,
        cloudImageId: row.id,
        cloudStoragePath: isExternalUrl(row.image_url) ? null : row.image_url,
        generationId: row.generation_id,
      }));

      setAdImages(gallery);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "فشل في تحميل بيانات الإعلان");
    } finally {
      setPageLoading(false);
    }
  }, [adId]);

  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    loadAdData();
  }, [user, userLoading, router, loadAdData]);

  // Handle text generation
  async function handleGenerated(results: TextGenerationOutput[], input: TextGenerationInput) {
    setCurrentResults(results);
    setCurrentInput(input);

    try {
      const batch = await createCopyBatch(adId, input.hook, input.offer, input.cta, results);
      setBatches((prev) => [batch, ...prev]);
    } catch (err) {
      console.error("Failed to save copy batch:", err);
    }
  }

  // Handle copy approval
  async function handleApproveCopy(result: TextGenerationOutput, index: number) {
    // Find the batch containing the current results
    const batch = batches.find(b =>
      JSON.stringify(b.copies) === JSON.stringify(currentResults)
    ) || batches[0];

    if (!batch) return;

    try {
      await approveCopy(batch.id, index, adId);
      setApprovedCopy(result);
      setApprovedBatchId(batch.id);
      setApprovedCopyIndex(index);

      // Update batches state
      setBatches((prev) =>
        prev.map((b) => ({
          ...b,
          is_approved_batch: b.id === batch.id,
          approved_copy_index: b.id === batch.id ? index : null,
        }))
      );
    } catch (err) {
      console.error("Failed to approve copy:", err);
    }
  }

  // Handle sidebar copy approval
  async function handleSidebarApprove(batchId: string, copyIndex: number) {
    try {
      await approveCopy(batchId, copyIndex, adId);
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        const copy = batch.copies[copyIndex];
        if (copy) {
          setApprovedCopy(copy);
          setApprovedBatchId(batchId);
          setApprovedCopyIndex(copyIndex);
        }
      }

      setBatches((prev) =>
        prev.map((b) => ({
          ...b,
          is_approved_batch: b.id === batchId,
          approved_copy_index: b.id === batchId ? copyIndex : null,
        }))
      );
    } catch (err) {
      console.error("Failed to approve copy:", err);
    }
  }

  // Handle image instructions changes (debounced save)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleImageInstructionsChange(instructions: string) {
    setImageInstructions(instructions);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateAdImageInstructions(adId, instructions, overrideGlobal).catch(console.error);
    }, 1000);
  }

  function handleOverrideChange(override: boolean) {
    setOverrideGlobal(override);
    updateAdImageInstructions(adId, imageInstructions, override).catch(console.error);
  }

  // Handle image generation
  function handleImagesGenerated(newImages: { style: string; url: string }[]) {
    const now = new Date().toISOString();
    const draftImages: GalleryImageItem[] = newImages.map((img, i) => ({
      id: `draft-${Date.now()}-${i}`,
      style: img.style,
      url: img.url,
      createdAt: now,
      isLocalSaved: false,
      isCloudSaved: false,
      cloudImageId: null,
      cloudStoragePath: null,
      generationId: null,
    }));
    setAdImages((prev) => [...draftImages, ...prev]);
    invalidateGallery();
  }

  async function handleSaveCloud(imageId: string) {
    const target = imagesRef.current.find((img) => img.id === imageId);
    if (!target || target.isCloudSaved) return;

    setSaveError("");
    setCloudSavingIds((prev) => new Set(prev).add(imageId));

    try {
      const { id, storagePath } = await saveImageToCloud(
        adId,
        target.style,
        target.url,
        target.generationId ?? undefined
      );

      setAdImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, isCloudSaved: true, cloudImageId: id, cloudStoragePath: storagePath }
            : img
        )
      );
      invalidateGallery();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save image to cloud.");
    } finally {
      setCloudSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  }

  // Save All locally
  function handleSaveAllLocal() {
    setIsSavingAllLocal(true);
    try {
      const unsaved = imagesRef.current.filter((img) => !img.isLocalSaved);
      for (const img of unsaved) {
        upsertLocalGalleryImage({ ...img, isLocalSaved: true });
      }
      setAdImages((prev) =>
        prev.map((img) => (img.isLocalSaved ? img : { ...img, isLocalSaved: true }))
      );
      invalidateGallery();
    } finally {
      setIsSavingAllLocal(false);
    }
  }

  // Save All to cloud
  async function handleSaveAllCloud() {
    const unsaved = imagesRef.current.filter((img) => !img.isCloudSaved);
    if (unsaved.length === 0) return;

    setIsSavingAllCloud(true);
    setSaveError("");

    try {
      for (const img of unsaved) {
        setCloudSavingIds((prev) => new Set(prev).add(img.id));
        try {
          const { id, storagePath } = await saveImageToCloud(
            adId,
            img.style,
            img.url,
            img.generationId ?? undefined
          );
          setAdImages((prev) =>
            prev.map((i) =>
              i.id === img.id
                ? { ...i, isCloudSaved: true, cloudImageId: id, cloudStoragePath: storagePath }
                : i
            )
          );
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : "Failed to save image to cloud.");
        } finally {
          setCloudSavingIds((prev) => {
            const next = new Set(prev);
            next.delete(img.id);
            return next;
          });
        }
      }
      invalidateGallery();
    } finally {
      setIsSavingAllCloud(false);
    }
  }

  if (userLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "var(--coral-400)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-md text-center py-16">
        <div
          className="rounded-xl px-6 py-8"
          style={{ background: "rgba(217,79,51,0.06)", border: "1px solid rgba(217,79,51,0.12)" }}
        >
          <p className="text-sm" style={{ color: "var(--error)" }}>{pageError}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-ghost mt-4 rounded-xl px-5 py-2.5 text-sm"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Ad Title */}
      <div>
        <button
          onClick={() => router.push("/")}
          className="mb-3 flex items-center gap-1.5 text-xs font-500 transition-colors"
          style={{ color: "var(--gray-400)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--coral-400)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          العودة للإعلانات
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--gray-900)" }}>
          {ad.title}
        </h1>
      </div>

      {/* Copy Generation Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Text Generation */}
        <div className="lg:col-span-2 space-y-8">
          {/* Form card */}
          <div className="glass-card p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="h-5 w-1 rounded-full" style={{ background: "var(--coral-400)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-800)" }}>
                توليد النص الروسي
              </h2>
            </div>
            <TextGenerationForm
              instructions={russianInstructions}
              adId={adId}
              initialInput={currentInput}
              onGenerated={handleGenerated}
            />
          </div>

          {/* Current batch results */}
          {currentResults.length > 0 && (
            <div className="animate-fade-in-up">
              <RussianTextOutput
                results={currentResults}
                approvedIndex={
                  // Show approved index only if current results match the approved batch
                  batches.find(b => b.id === approvedBatchId && JSON.stringify(b.copies) === JSON.stringify(currentResults))
                    ? approvedCopyIndex
                    : null
                }
                onApprove={handleApproveCopy}
              />
            </div>
          )}
        </div>

        {/* Right: Copy History Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card sticky top-20 p-4 max-h-[calc(100vh-6rem)] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            <CopyHistorySidebar
              batches={batches}
              onApproveCopy={handleSidebarApprove}
            />
          </div>
        </div>
      </div>

      {/* Image Generation Section — only show when there's an approved copy */}
      {approvedCopy && (
        <div className="space-y-8">
          <div className="glass-card p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="h-5 w-1 rounded-full" style={{ background: "var(--navy-500)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--gray-800)" }}>
                توليد الصور
              </h2>
            </div>
            <ImageGenerationForm
              russianText={approvedCopy.full_copy_ru}
              adId={adId}
              imageInstructions={imageInstructions}
              overrideGlobal={overrideGlobal}
              globalImageInstructions={globalImageInstructions}
              onImageInstructionsChange={handleImageInstructionsChange}
              onOverrideChange={handleOverrideChange}
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
          {adImages.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-1 rounded-full" style={{ background: "var(--navy-500)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--gray-800)" }}>
                  صور الإعلان ({adImages.length})
                </h2>
              </div>
              <ImageGrid
                images={adImages}
                onSaveCloud={handleSaveCloud}
                onSaveAllLocal={handleSaveAllLocal}
                onSaveAllCloud={handleSaveAllCloud}
                cloudSavingIds={cloudSavingIds}
                isSavingAllLocal={isSavingAllLocal}
                isSavingAllCloud={isSavingAllCloud}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
