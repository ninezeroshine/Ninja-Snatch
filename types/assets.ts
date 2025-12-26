/**
 * Asset Types for Ninja Snatch
 * 
 * Type definitions for asset management and ZIP bundling.
 */

/**
 * Asset type categories
 */
export type AssetType = 'image' | 'font' | 'video' | 'css' | 'svg' | 'other';

/**
 * Single asset descriptor
 */
export interface Asset {
    /** Original URL of the asset */
    originalUrl: string;
    /** Local path in the ZIP bundle */
    localPath: string;
    /** Asset type category */
    type: AssetType;
    /** Asset file blob (after download) */
    blob?: Blob;
    /** File size in bytes */
    size?: number;
    /** MIME type */
    mimeType?: string;
    /** Download status */
    status: AssetStatus;
    /** Error message if failed */
    error?: string;
}

/**
 * Asset download status
 */
export type AssetStatus =
    | 'pending'
    | 'downloading'
    | 'completed'
    | 'failed'
    | 'skipped';

/**
 * ZIP bundle structure
 */
export interface ZipBundle {
    /** Main HTML file */
    html: string;
    /** Combined CSS file */
    css: string;
    /** Collected assets */
    assets: Asset[];
    /** Total size estimate */
    totalSize: number;
    /** Generation timestamp */
    timestamp: number;
}

/**
 * Asset scan result from document
 */
export interface AssetScanResult {
    /** All discovered assets */
    assets: Asset[];
    /** Total count by type */
    counts: Record<AssetType, number>;
    /** Estimated total size */
    estimatedSize: number;
}

/**
 * Background message for asset fetching
 */
export interface FetchAssetRequest {
    type: 'FETCH_ASSET';
    url: string;
    referer: string;
}

/**
 * Background message response
 * Note: Uses base64 string instead of ArrayBuffer because
 * Chrome messaging API cannot transfer ArrayBuffer directly
 */
export interface FetchAssetResponse {
    success: boolean;
    /** Base64 encoded data (ArrayBuffer can't transfer through messaging) */
    data?: string;
    error?: string;
    mimeType?: string;
    /** Size in bytes */
    size?: number;
}

