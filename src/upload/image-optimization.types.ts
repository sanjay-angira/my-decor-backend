import type { OptimizedImageColumns } from '../commonServices/optimized-image-columns';
import {
  emptyOptimizedImageColumns,
  setColumnForWidth,
} from '../commonServices/optimized-image-columns';

export type ImageOptimizationType =
  | 'product'
  | 'category'
  | 'category_desktop'
  | 'category_tablet'
  | 'category_banner'
  | 'blog'
  | 'offer_desktop'
  | 'offer_tablet'
  | 'offer_mobile'
  | 'category_mobile';

export type ImageOptimizationPreset = {
  type: ImageOptimizationType;
  folder: string;
  widths: number[];
  webpQuality: number;
  /**
   * When true, upload stores a single WebP file (no original + size variants).
  * Used for responsive offer, blog, and category images. Products
   * keep the multi-size pipeline.
   */
  webpOnly?: boolean;
};

export const IMAGE_OPTIMIZATION_PRESETS: Record<
  ImageOptimizationType,
  ImageOptimizationPreset
> = {
  product: {
    type: 'product',
    folder: 'products',
    widths: [400, 800, 1200],
    webpQuality: 82,
  },
  category: {
    type: 'category',
    folder: 'categories',
    widths: [800],
    webpQuality: 82,
    webpOnly: true,
  },
  category_desktop: {
    type: 'category_desktop',
    folder: 'categories/desktop',
    widths: [1920],
    webpQuality: 85,
    webpOnly: true,
  },
  category_tablet: {
    type: 'category_tablet',
    folder: 'categories/tablet',
    widths: [1200],
    webpQuality: 85,
    webpOnly: true,
  },
  category_banner: {
    type: 'category_banner',
    folder: 'categories/banners',
    widths: [1920],
    webpQuality: 85,
    webpOnly: true,
  },
  blog: {
    type: 'blog',
    folder: 'blogs',
    widths: [1200],
    webpQuality: 82,
    webpOnly: true,
  },
  offer_desktop: {
    type: 'offer_desktop',
    folder: 'offers/desktop',
    widths: [1920],
    webpQuality: 85,
    webpOnly: true,
  },
  offer_tablet: {
    type: 'offer_tablet',
    folder: 'offers/tablet',
    widths: [1200],
    webpQuality: 85,
    webpOnly: true,
  },
  offer_mobile: {
    type: 'offer_mobile',
    folder: 'offers/mobile',
    widths: [800],
    webpQuality: 85,
    webpOnly: true,
  },
  category_mobile: {
    type: 'category_mobile',
    folder: 'categories/mobile',
    widths: [800],
    webpQuality: 82,
    webpOnly: true,
  },
};

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/avif',
] as const;

export const MAX_OPTIMIZED_IMAGE_BYTES = 10 * 1024 * 1024;

/** Flat upload result — no nested JSON sizes. */
export type OptimizedImageAsset = OptimizedImageColumns & {
  /** Alias of originalUrl for older clients. */
  original: string;
  Location: string;
  Key: string;
  Bucket: string;
  ETag?: string;
  assetId: string;
  width: number;
  height: number;
};

export function buildFlatAssetBase(
  originalUrl: string,
): OptimizedImageColumns {
  return emptyOptimizedImageColumns(originalUrl);
}

export { setColumnForWidth, emptyOptimizedImageColumns };
