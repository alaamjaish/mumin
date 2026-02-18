export interface Generation {
  id: string;
  user_id: string;
  hook_ar: string;
  offer_ar: string;
  cta_ar: string;
  hook_ru: string | null;
  offer_ru: string | null;
  cta_ru: string | null;
  full_copy_ru: string | null;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  generation_id: string;
  user_id: string;
  style: string;
  image_url: string;
  is_selected: boolean;
  created_at: string;
}

export interface TextGenerationInput {
  hook: string;
  offer: string;
  cta: string;
}

export interface TextGenerationOutput {
  hook_ru: string;
  offer_ru: string;
  cta_ru: string;
  full_copy_ru: string;
}

export interface ImageGenerationInput {
  russian_text: string;
  styles: string[];
  count_per_style: number;
}

export interface AdStyle {
  id: string;
  name: string;
  name_ar: string;
  prompt_modifier: string;
}

export interface ApprovedTextContext {
  input: TextGenerationInput;
  approved: TextGenerationOutput;
}

export interface GalleryImageItem {
  id: string;
  style: string;
  url: string;
  createdAt: string;
  isLocalSaved: boolean;
  isCloudSaved: boolean;
  cloudImageId?: string | null;
  cloudStoragePath?: string | null;
  generationId?: string | null;
}

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  image_instructions: string | null;
  override_global_image_instructions: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdCopyBatch {
  id: string;
  ad_id: string;
  user_id: string;
  hook_ar: string;
  offer_ar: string;
  cta_ar: string;
  copies: TextGenerationOutput[];
  is_approved_batch: boolean;
  approved_copy_index: number | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  russian_instructions: string | null;
  global_image_instructions: string | null;
  updated_at: string;
}

export interface ApprovedCopy {
  batch_id: string;
  copy: TextGenerationOutput;
}
