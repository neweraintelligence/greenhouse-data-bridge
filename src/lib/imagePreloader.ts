/**
 * Image Preloading and Caching Utility
 *
 * Provides:
 * - Preloading of images before they're needed
 * - In-memory cache to track loaded images
 * - Batch preloading for entire use cases
 * - Loading state tracking
 */

import { nodeImageMap } from './nodeImages';

// In-memory cache of preloaded image URLs
const preloadedImages = new Set<string>();
const loadingImages = new Set<string>();
const failedImages = new Set<string>();

// Image load promises for deduplication
const loadPromises = new Map<string, Promise<boolean>>();

/**
 * Preload a single image
 * Returns a promise that resolves to true if successful, false if failed
 */
export function preloadImage(src: string): Promise<boolean> {
  // Already loaded
  if (preloadedImages.has(src)) {
    return Promise.resolve(true);
  }

  // Already failed
  if (failedImages.has(src)) {
    return Promise.resolve(false);
  }

  // Already loading - return existing promise
  if (loadPromises.has(src)) {
    return loadPromises.get(src)!;
  }

  // Start loading
  loadingImages.add(src);

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();

    img.onload = () => {
      preloadedImages.add(src);
      loadingImages.delete(src);
      loadPromises.delete(src);
      resolve(true);
    };

    img.onerror = () => {
      failedImages.add(src);
      loadingImages.delete(src);
      loadPromises.delete(src);
      resolve(false);
    };

    // Set src to trigger load
    img.src = src;
  });

  loadPromises.set(src, promise);
  return promise;
}

/**
 * Preload multiple images in parallel
 * Returns count of successfully loaded images
 */
export async function preloadImages(srcs: string[]): Promise<number> {
  const results = await Promise.all(srcs.map(preloadImage));
  return results.filter(Boolean).length;
}

/**
 * Preload all images for a specific use case
 */
export async function preloadUseCaseImages(useCase: string): Promise<number> {
  const images = nodeImageMap[useCase];
  if (!images) return 0;

  const urls = Object.values(images);
  return preloadImages(urls);
}

/**
 * Preload images for multiple use cases
 */
export async function preloadAllUseCaseImages(): Promise<number> {
  const allUrls = new Set<string>();

  Object.values(nodeImageMap).forEach(useCaseImages => {
    Object.values(useCaseImages).forEach(url => {
      allUrls.add(url);
    });
  });

  return preloadImages(Array.from(allUrls));
}

/**
 * Check if an image is already preloaded
 */
export function isImagePreloaded(src: string): boolean {
  return preloadedImages.has(src);
}

/**
 * Check if an image is currently loading
 */
export function isImageLoading(src: string): boolean {
  return loadingImages.has(src);
}

/**
 * Check if an image failed to load
 */
export function isImageFailed(src: string): boolean {
  return failedImages.has(src);
}

/**
 * Get the current state of an image
 */
export function getImageState(src: string): 'preloaded' | 'loading' | 'failed' | 'pending' {
  if (preloadedImages.has(src)) return 'preloaded';
  if (loadingImages.has(src)) return 'loading';
  if (failedImages.has(src)) return 'failed';
  return 'pending';
}

/**
 * Clear the cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  preloadedImages.clear();
  loadingImages.clear();
  failedImages.clear();
  loadPromises.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  preloaded: number;
  loading: number;
  failed: number;
} {
  return {
    preloaded: preloadedImages.size,
    loading: loadingImages.size,
    failed: failedImages.size,
  };
}

/**
 * Preload adjacent slides based on current position
 * Preloads N slides ahead and M slides behind
 */
export function preloadAdjacentSlides(
  useCase: string,
  nodeTypes: string[],
  currentIndex: number,
  ahead: number = 2,
  behind: number = 1
): void {
  const images = nodeImageMap[useCase];
  if (!images) return;

  // Get indices to preload
  const indices: number[] = [];
  for (let i = currentIndex - behind; i <= currentIndex + ahead; i++) {
    if (i >= 0 && i < nodeTypes.length && i !== currentIndex) {
      indices.push(i);
    }
  }

  // Preload images for those indices
  indices.forEach(i => {
    const nodeType = nodeTypes[i];
    const url = images[nodeType];
    if (url) {
      preloadImage(url);
    }
  });
}

/**
 * Hook-friendly preloader that returns loading state
 */
export function useImagePreload(src: string | null): {
  isLoaded: boolean;
  isLoading: boolean;
  isFailed: boolean;
} {
  if (!src) {
    return { isLoaded: false, isLoading: false, isFailed: false };
  }

  const state = getImageState(src);

  // Trigger preload if pending
  if (state === 'pending') {
    preloadImage(src);
  }

  return {
    isLoaded: state === 'preloaded',
    isLoading: state === 'loading' || state === 'pending',
    isFailed: state === 'failed',
  };
}
