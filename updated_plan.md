 Plan to implement                                                                                    │
│                                                                                                      │
│ Mumin App Restructure: Ad Generator Dashboard + Gallery                                              │
│                                                                                                      │
│ Context                                                                                              │
│                                                                                                      │
│ The app currently uses a 3-step linear wizard (/generate → /images → /gallery) where state lives in  │
│ sessionStorage and is lost on refresh. The user wants a persistent, project-based architecture where │
│  each ad is its own entity saved to Supabase, with a dashboard grid view and everything on one       │
│ vertical page per ad.                                                                                │
│                                                                                                      │
│ Architecture Overview                                                                                │
│                                                                                                      │
│ Two main pages:                                                                                      │
│ - / — Ad Generator dashboard (grid of ad cards + global settings)                                    │
│ - /gallery — Gallery (all saved images across all ads)                                               │
│                                                                                                      │
│ Per-ad page: /ad/[id] — Single vertical scrollable page with copy generator on top, image generator  │
│ below                                                                                                │
│                                                                                                      │
│ Settings modal (from navbar): Russian Instructions (global) + General Image Instructions (global)    │
│                                                                                                      │
│ Per-ad image instructions with override toggle (off = global+per-ad combined, on = per-ad only)      │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 1: Database Schema (Supabase SQL)                                                              │
│                                                                                                      │
│ New ads table                                                                                        │
│                                                                                                      │
│ CREATE TABLE ads (                                                                                   │
│   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                     │
│   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,                                 │
│   title TEXT NOT NULL,                                                                               │
│   image_instructions TEXT,          -- per-ad image instructions                                     │
│   override_global_image_instructions BOOLEAN NOT NULL DEFAULT false,                                 │
│   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),                                                     │
│   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()                                                      │
│ );                                                                                                   │
│ ALTER TABLE ads ENABLE ROW LEVEL SECURITY;                                                           │
│ CREATE POLICY "Users manage own ads" ON ads FOR ALL                                                  │
│   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);                                    │
│                                                                                                      │
│ New ad_copy_batches table                                                                            │
│                                                                                                      │
│ CREATE TABLE ad_copy_batches (                                                                       │
│   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                     │
│   ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,                                          │
│   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,                                 │
│   hook_ar TEXT NOT NULL,                                                                             │
│   offer_ar TEXT NOT NULL,                                                                            │
│   cta_ar TEXT NOT NULL,                                                                              │
│   copies JSONB NOT NULL,              -- array of 5 TextGenerationOutput objects                     │
│   is_approved_batch BOOLEAN NOT NULL DEFAULT false,                                                  │
│   approved_copy_index INTEGER,        -- 0-4, NULL if none approved                                  │
│   created_at TIMESTAMPTZ NOT NULL DEFAULT now()                                                      │
│ );                                                                                                   │
│ ALTER TABLE ad_copy_batches ENABLE ROW LEVEL SECURITY;                                               │
│ CREATE POLICY "Users manage own batches" ON ad_copy_batches FOR ALL                                  │
│   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);                                    │
│                                                                                                      │
│ New user_settings table                                                                              │
│                                                                                                      │
│ CREATE TABLE user_settings (                                                                         │
│   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                     │
│   user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,                          │
│   russian_instructions TEXT,          -- global copy instructions                                    │
│   global_image_instructions TEXT,     -- global image theme/target instructions                      │
│   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()                                                      │
│ );                                                                                                   │
│ ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;                                                 │
│ CREATE POLICY "Users manage own settings" ON user_settings FOR ALL                                   │
│   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);                                    │
│                                                                                                      │
│ Modify generated_images table                                                                        │
│                                                                                                      │
│ ALTER TABLE generated_images ADD COLUMN ad_id UUID REFERENCES ads(id) ON DELETE SET NULL;            │
│                                                                                                      │
│ Old data stays with ad_id = NULL — no migration needed.                                              │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 2: Types                                                                                       │
│                                                                                                      │
│ File: src/types/index.ts — Add new interfaces:                                                       │
│                                                                                                      │
│ - Ad — id, user_id, title, image_instructions, override_global_image_instructions, created_at,       │
│ updated_at                                                                                           │
│ - AdCopyBatch — id, ad_id, user_id, hook_ar, offer_ar, cta_ar, copies (TextGenerationOutput[]),      │
│ is_approved_batch, approved_copy_index, created_at                                                   │
│ - UserSettings — id, user_id, russian_instructions, global_image_instructions, updated_at            │
│ - ApprovedCopy — batch_id, copy (TextGenerationOutput)                                               │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 3: Supabase Data Access Layer                                                                  │
│                                                                                                      │
│ New file: src/lib/supabase/queries.ts                                                                │
│                                                                                                      │
│ Centralized CRUD functions:                                                                          │
│ - fetchAds(), fetchAd(id), createAd(title), deleteAd(id), updateAdImageInstructions(id,              │
│ instructions, override)                                                                              │
│ - fetchCopyBatches(adId), createCopyBatch(adId, hookAr, offerAr, ctaAr, copies),                     │
│ approveCopy(batchId, copyIndex, adId), getApprovedCopy(adId)                                         │
│ - fetchUserSettings(), upsertUserSettings(russianInstructions, globalImageInstructions)              │
│ - fetchAdImages(adId), saveImageToCloud(adId, style, imageDataUrl)                                   │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 4: Component Changes                                                                           │
│                                                                                                      │
│ Modified Components                                                                                  │
│                                                                                                      │
│ Component: Navbar.tsx                                                                                │
│ Changes: Replace 3-step stepper → 2 nav links ("مولد الإعلانات" + "المعرض") + settings gear icon     │
│ ────────────────────────────────────────                                                             │
│ Component: AppProvider.tsx                                                                           │
│ Changes: Remove wizard state (generateResults, approvedContext, draftImages, etc.). Add user,        │
│   userLoading, russianInstructions, globalImageInstructions. Keep gallery state.                     │
│ ────────────────────────────────────────                                                             │
│ Component: TextGenerationForm.tsx                                                                    │
│ Changes: Accept instructions + adId as props. Remove local instructions state/collapsible UI.        │
│ Populate                                                                                             │
│   fields from last batch if resuming.                                                                │
│ ────────────────────────────────────────                                                             │
│ Component: RussianTextOutput.tsx                                                                     │
│ Changes: Change approve to in-page action (no navigation). Add teal highlight for approved copy.     │
│ Change                                                                                               │
│   button text to "اعتماد هذه النسخة".                                                                │
│ ────────────────────────────────────────                                                             │
│ Component: ImageGenerationForm.tsx                                                                   │
│ Changes: Accept adId prop. Visual instructions textarea becomes per-ad field (saved to Supabase).    │
│ Add                                                                                                  │
│   override toggle for global instructions. Show resolved instructions (global+per-ad or per-ad       │
│ only).                                                                                               │
│                                                                                                      │
│ New Components                                                                                       │
│                                                                                                      │
│ Component: AdGrid.tsx                                                                                │
│ Purpose: Responsive grid of ad cards on dashboard. Each card: title, Arabic hook, thumbnail. "+"     │
│ card                                                                                                 │
│   to create new ad. Delete button with confirmation.                                                 │
│ ────────────────────────────────────────                                                             │
│ Component: CreateAdDialog.tsx                                                                        │
│ Purpose: Simple modal: title input + create button → createAd() → navigate to /ad/[id]               │
│ ────────────────────────────────────────                                                             │
│ Component: DeleteAdDialog.tsx                                                                        │
│ Purpose: Confirmation modal → deleteAd() → remove from grid                                          │
│ ────────────────────────────────────────                                                             │
│ Component: SettingsModal.tsx                                                                         │
│ Purpose: Modal with 2 sections: (1) Russian Instructions textarea, (2) Global Image Instructions     │
│   textarea. Save button → upsertUserSettings(). Reset to defaults button.                            │
│ ────────────────────────────────────────                                                             │
│ Component: CopyHistorySidebar.tsx                                                                    │
│ Purpose: Right sidebar on ad page. Shows all past copy batches (newest first). Each batch: timestamp │
│  +                                                                                                   │
│   hook preview, expandable to see all 5 copies. Click a copy → approveCopy(). Approved copy has teal │
│                                                                                                      │
│   highlight.                                                                                         │
│                                                                                                      │
│ Unchanged Components (DO NOT TOUCH)                                                                  │
│                                                                                                      │
│ - ImageGrid.tsx, ImageCard.tsx, StyleSelector.tsx                                                    │
│ - src/lib/gemini.ts, src/lib/nano-banana.ts, src/lib/prompts.ts, src/lib/styles.ts                   │
│ - src/app/api/generate-text/route.ts, src/app/api/generate-images/route.ts                           │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 5: Page Changes                                                                                │
│                                                                                                      │
│ /src/app/page.tsx — Rewrite as Ad Grid Dashboard                                                     │
│                                                                                                      │
│ - Fetch all ads on mount                                                                             │
│ - Render <AdGrid> with create/delete functionality                                                   │
│ - Redirect to /login if not authenticated                                                            │
│                                                                                                      │
│ /src/app/ad/[id]/page.tsx — New Individual Ad Page                                                   │
│                                                                                                      │
│ Vertical single-page layout:                                                                         │
│                                                                                                      │
│ ┌─────────────────────────────────────────────────┐                                                  │
│ │  Ad Title (editable?)                           │                                                  │
│ ├──────────────────────────┬──────────────────────┤                                                  │
│ │  TextGenerationForm      │  CopyHistorySidebar  │                                                  │
│ │  (hook/offer/cta)        │  (all past batches)  │                                                  │
│ │                          │  Click copy →        │                                                  │
│ │  Current batch of 5      │  approve it          │                                                  │
│ │  (RussianTextOutput)     │                      │                                                  │
│ ├──────────────────────────┼──────────────────────┤                                                  │
│ │  Image Generator         │  Per-Ad Image        │                                                  │
│ │  StyleSelector           │  Instructions        │                                                  │
│ │  Count + Generate btn    │  (textarea)          │                                                  │
│ │                          │  [x] Override global │                                                  │
│ ├──────────────────────────┴──────────────────────┤                                                  │
│ │  ImageGrid (all generated images for this ad)   │                                                  │
│ └─────────────────────────────────────────────────┘                                                  │
│                                                                                                      │
│ On mount: fetch ad, copy batches, approved copy, ad images, user settings.                           │
│                                                                                                      │
│ Image instructions resolved at generation time:                                                      │
│ - Override OFF → global_image_instructions + per-ad image_instructions (concatenated)                │
│ - Override ON → per-ad image_instructions only                                                       │
│                                                                                                      │
│ /src/app/gallery/page.tsx — Minor updates                                                            │
│                                                                                                      │
│ - Change link from /images to /                                                                      │
│ - Remove step badge                                                                                  │
│                                                                                                      │
│ Delete: /src/app/generate/page.tsx and /src/app/images/page.tsx                                      │
│                                                                                                      │
│ Update redirects:                                                                                    │
│                                                                                                      │
│ - login/page.tsx: redirect /generate → /                                                             │
│ - api/auth/callback/route.ts: default next /generate → /                                             │
│                                                                                                      │
│ ---                                                                                                  │
│ Phase 6: Implementation Order                                                                        │
│                                                                                                      │
│ 1. SQL migrations — Run in Supabase dashboard (no code changes)                                      │
│ 2. Types — Update src/types/index.ts                                                                 │
│ 3. Data access layer — Create src/lib/supabase/queries.ts                                            │
│ 4. AppProvider — Simplify state, add auth + settings                                                 │
│ 5. Navbar — Rewrite to 2-tab + settings gear                                                         │
│ 6. SettingsModal — Russian + Global Image instructions                                               │
│ 7. Dashboard page — AdGrid, CreateAdDialog, DeleteAdDialog, rewrite page.tsx                         │
│ 8. Ad page — CopyHistorySidebar, modify TextGenerationForm/RussianTextOutput/ImageGenerationForm,    │
│ create /ad/[id]/page.tsx                                                                             │
│ 9. Gallery update — Change links                                                                     │
│ 10. Cleanup — Delete old pages, remove sessionStorage refs, remove old AppProvider state             │
│                                                                                                      │
│ ---                                                                                                  │
│ Verification                                                                                         │
│                                                                                                      │
│ 1. Create a new ad from the grid → verify it appears in Supabase ads table                           │
│ 2. Open the ad → generate 5 copies → verify saved in ad_copy_batches                                 │
│ 3. Approve a copy → verify is_approved_batch + approved_copy_index updated                           │
│ 4. Regenerate → verify old batch preserved in sidebar, new batch shown prominently                   │
│ 5. Click an old copy from sidebar → verify it becomes the approved copy                              │
│ 6. Generate images → verify saved to generated_images with ad_id                                     │
│ 7. Edit per-ad image instructions → toggle override → verify correct instructions sent to API        │
│ 8. Open settings modal → edit Russian + Global Image instructions → verify saved in user_settings    │
│ 9. Navigate to Gallery → verify ALL images from all ads appear                                       │
│ 10. Delete an ad → verify cascade deletes batches, images get ad_id = NULL                           │
│ 11. Refresh page at any point → verify all state persists from Supabase     