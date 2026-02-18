import { createClient } from "./client";
import type { Ad, AdCopyBatch, UserSettings, TextGenerationOutput } from "@/types";

function supabase() {
  return createClient();
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase().auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

/* ------------------------------------------------------------------ */
/*  Ads                                                                */
/* ------------------------------------------------------------------ */

export async function fetchAds(): Promise<Ad[]> {
  const { data, error } = await supabase()
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ad[];
}

export async function fetchAd(id: string): Promise<Ad> {
  const { data, error } = await supabase()
    .from("ads")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Ad;
}

export async function createAd(title: string): Promise<Ad> {
  const userId = await getUserId();
  const { data, error } = await supabase()
    .from("ads")
    .insert({ title, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Ad;
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await supabase().from("ads").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAdImageInstructions(
  id: string,
  imageInstructions: string | null,
  overrideGlobal: boolean
): Promise<void> {
  const { error } = await supabase()
    .from("ads")
    .update({
      image_instructions: imageInstructions,
      override_global_image_instructions: overrideGlobal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Copy Batches                                                       */
/* ------------------------------------------------------------------ */

export async function fetchCopyBatches(adId: string): Promise<AdCopyBatch[]> {
  const { data, error } = await supabase()
    .from("ad_copy_batches")
    .select("*")
    .eq("ad_id", adId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdCopyBatch[];
}

export async function createCopyBatch(
  adId: string,
  hookAr: string,
  offerAr: string,
  ctaAr: string,
  copies: TextGenerationOutput[]
): Promise<AdCopyBatch> {
  const userId = await getUserId();
  const { data, error } = await supabase()
    .from("ad_copy_batches")
    .insert({
      ad_id: adId,
      user_id: userId,
      hook_ar: hookAr,
      offer_ar: offerAr,
      cta_ar: ctaAr,
      copies,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AdCopyBatch;
}

export async function approveCopy(
  batchId: string,
  copyIndex: number,
  adId: string
): Promise<void> {
  // Un-approve all batches for this ad first
  const { error: clearError } = await supabase()
    .from("ad_copy_batches")
    .update({ is_approved_batch: false, approved_copy_index: null })
    .eq("ad_id", adId);
  if (clearError) throw clearError;

  // Approve the selected batch + copy
  const { error } = await supabase()
    .from("ad_copy_batches")
    .update({ is_approved_batch: true, approved_copy_index: copyIndex })
    .eq("id", batchId);
  if (error) throw error;
}

export async function getApprovedCopy(
  adId: string
): Promise<{ batchId: string; copy: TextGenerationOutput } | null> {
  const { data, error } = await supabase()
    .from("ad_copy_batches")
    .select("*")
    .eq("ad_id", adId)
    .eq("is_approved_batch", true)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.approved_copy_index == null) return null;
  const batch = data as AdCopyBatch;
  const idx = batch.approved_copy_index as number;
  const copy = batch.copies[idx];
  if (!copy) return null;
  return { batchId: batch.id, copy };
}

/* ------------------------------------------------------------------ */
/*  User Settings                                                      */
/* ------------------------------------------------------------------ */

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase()
    .from("user_settings")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as UserSettings | null;
}

export async function upsertUserSettings(
  russianInstructions: string | null,
  globalImageInstructions: string | null
): Promise<UserSettings> {
  // Get current user
  const { data: { user }, error: userError } = await supabase().auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase()
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        russian_instructions: russianInstructions,
        global_image_instructions: globalImageInstructions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as UserSettings;
}

/* ------------------------------------------------------------------ */
/*  Ad Images                                                          */
/* ------------------------------------------------------------------ */

export async function fetchAdImages(adId: string) {
  const { data, error } = await supabase()
    .from("generated_images")
    .select("id, style, image_url, created_at, generation_id, ad_id")
    .eq("ad_id", adId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveImageToCloud(
  adId: string,
  style: string,
  imageDataUrl: string,
  generationId?: string
): Promise<{ id: string; storagePath: string }> {
  const sb = supabase();
  const { data: { user }, error: userError } = await sb.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Convert data URL to blob
  const blobResponse = await fetch(imageDataUrl);
  const blob = await blobResponse.blob();
  const mimeType = blob.type || "image/png";
  const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "png";
  const storagePath = `${user.id}/${adId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;

  const { error: uploadError } = await sb.storage
    .from("generated-images")
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });
  if (uploadError) throw uploadError;

  // Determine generation_id — use existing or create new
  let genId = generationId;
  if (!genId) {
    const { data: genData, error: genError } = await sb
      .from("generations")
      .insert({ hook_ar: "", offer_ar: "", cta_ar: "" })
      .select("id")
      .single();
    if (genError) throw genError;
    genId = genData.id;
  }

  const { data, error: insertError } = await sb
    .from("generated_images")
    .insert({
      generation_id: genId,
      style,
      image_url: storagePath,
      ad_id: adId,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  return { id: data.id, storagePath };
}
