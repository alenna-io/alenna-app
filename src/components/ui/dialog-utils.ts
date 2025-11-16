/**
 * Dialog Utilities
 * 
 * Shared utilities for fixing pointer-events issues with Radix UI dialogs.
 * When Radix dialogs open, they set pointer-events: none on the body,
 * which prevents interaction. These utilities ensure dialog content remains interactive.
 */

/**
 * Classes to apply to dialog content to fix pointer-events
 * Includes !important to override Radix's pointer-events: none on body
 */
export const DIALOG_POINTER_FIX_CLASSES = "!pointer-events-auto [&_*]:!pointer-events-auto"

/**
 * Inline style to apply to dialog content
 */
export const DIALOG_POINTER_FIX_STYLE = { pointerEvents: 'auto' as const }

