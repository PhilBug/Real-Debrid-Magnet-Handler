/**
 * Version utility - provides build-time version information
 *
 * The version is injected at build time via Vite's define option.
 * This avoids runtime file system access and keeps the bundle small.
 */

declare const __APP_VERSION__: string

/**
 * Application version string
 * @example "1.0.0"
 */
export const VERSION = __APP_VERSION__ ?? '1.0.0'
