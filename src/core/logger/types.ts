// ---------------------------------------------------------------------------
// Logger data model
//
// Shared shapes for structured log events flowing from Logger.createEvent()
// through the TransportManager to individual transports. Type-only; emits no
// runtime code.
// ---------------------------------------------------------------------------

/** Supported log levels. */
export type LogLevel = "debug" | "info" | "success" | "warn" | "error" | "line";

/** Optional metadata attached to a log event. */
export interface LogMeta {
  scope?: string;
  depth?: number;
  groupId?: string;
  parentId?: string;
  [key: string]: unknown;
}

/** A structured log event as produced by Logger.createEvent(). */
export interface LogEvent {
  time: string;
  level: LogLevel;
  message: string;
  prefix: string;
  meta: LogMeta;
  scope: string | null;
  depth: number;
  groupId: string | null;
  parentId: string | null;
}
