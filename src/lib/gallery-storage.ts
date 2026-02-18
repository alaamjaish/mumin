"use client";

import { GalleryImageItem } from "@/types";

export const LOCAL_GALLERY_STORAGE_KEY = "mumin.local.gallery.images";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeGalleryItem(
  item: unknown,
  index: number
): GalleryImageItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const candidate = item as Partial<GalleryImageItem> & {
    style?: unknown;
    url?: unknown;
  };

  if (typeof candidate.style !== "string" || typeof candidate.url !== "string") {
    return null;
  }

  const createdAt =
    typeof candidate.createdAt === "string" && candidate.createdAt
      ? candidate.createdAt
      : new Date().toISOString();
  const cloudImageId =
    typeof candidate.cloudImageId === "string" ? candidate.cloudImageId : null;
  const cloudStoragePath =
    typeof candidate.cloudStoragePath === "string"
      ? candidate.cloudStoragePath
      : null;
  const generationId =
    typeof candidate.generationId === "string" ? candidate.generationId : null;
  const isCloudSaved =
    typeof candidate.isCloudSaved === "boolean"
      ? candidate.isCloudSaved
      : Boolean(cloudImageId || cloudStoragePath);
  const isLocalSaved =
    typeof candidate.isLocalSaved === "boolean" ? candidate.isLocalSaved : true;
  const id =
    typeof candidate.id === "string" && candidate.id
      ? candidate.id
      : createId(`legacy-${index}`);

  return {
    id,
    style: candidate.style,
    url: candidate.url,
    createdAt,
    isLocalSaved,
    isCloudSaved,
    cloudImageId,
    cloudStoragePath,
    generationId,
  };
}

export function readLocalGalleryImages(): GalleryImageItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .map((item, index) => normalizeGalleryItem(item, index))
      .filter((item): item is GalleryImageItem => Boolean(item));

    normalized.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Persist normalized structure so legacy objects are migrated once.
    writeLocalGalleryImages(normalized);

    return normalized;
  } catch {
    return [];
  }
}

export function writeLocalGalleryImages(images: GalleryImageItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LOCAL_GALLERY_STORAGE_KEY, JSON.stringify(images));
}

export function upsertLocalGalleryImage(image: GalleryImageItem): GalleryImageItem[] {
  const current = readLocalGalleryImages();
  const index = current.findIndex((item) => item.id === image.id);

  if (index >= 0) {
    current[index] = image;
  } else {
    current.push(image);
  }

  current.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  writeLocalGalleryImages(current);
  return current;
}

export function mergeIntoLocalGallery(images: GalleryImageItem[]): GalleryImageItem[] {
  const current = readLocalGalleryImages();
  const map = new Map(current.map((item) => [item.id, item]));

  for (const image of images) {
    map.set(image.id, image);
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  writeLocalGalleryImages(merged);
  return merged;
}

export function createDraftImage(style: string, url: string): GalleryImageItem {
  return {
    id: createId("img"),
    style,
    url,
    createdAt: new Date().toISOString(),
    isLocalSaved: false,
    isCloudSaved: false,
    cloudImageId: null,
    cloudStoragePath: null,
    generationId: null,
  };
}
