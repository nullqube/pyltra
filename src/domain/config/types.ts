// ---------------------------------------------------------------------------
// Config data model
//
// Shared shapes for the user-facing config.yaml after it has been validated,
// merged with defaults, and normalized. These are type-only declarations and
// emit no runtime code.
// ---------------------------------------------------------------------------

/** Site-wide metadata (config.yaml `site:` block). */
export interface SiteMeta {
  title?: string;
}

/** A configured language, e.g. `{ code: 'en', name: 'English' }`. */
export interface LanguageConfig {
  /** Language code, e.g. 'en' */
  code: string;
  /** Display name, e.g. 'English' */
  name: string;
}

/** A single page entry under `pages:`. */
export interface PageConfig {
  /** Data file pattern, e.g. '${lang}.index.yaml' */
  file?: string;
  /** Fallback data if the file is missing. */
  fallback?: Record<string, unknown>;
}

/** A single item inside a collection. */
export interface CollectionItemConfig {
  slug: string;
  file: string;
  fallback?: Record<string, unknown>;
}

/** A configured collection under `collections:`. */
export interface CollectionConfig {
  template: string;
  item_template: string;
  dataFile: string;
  items: CollectionItemConfig[];
}

/** Resolved glob patterns for the different asset kinds. */
export interface AssetsPathsConfig {
  scss: string;
  css: string;
  js: string;
  img: string;
  other: string[];
}

/** Normalized project paths derived from the config. */
export interface PathsConfig {
  src: string;
  dist: string;
  data: string;
  templates: string;
  assets: AssetsPathsConfig;
}

/** The full site configuration after merge + normalization. */
export interface SiteConfig {
  site?: SiteMeta;
  languages: LanguageConfig[];
  pages: Record<string, PageConfig>;
  collections: Record<string, CollectionConfig>;
  bundles: string[];
  /** User overrides for paths; full paths are derived via buildPaths(). */
  paths?: Partial<PathsConfig>;
}
