/** Most frequent viewport publishing to children, in milliseconds. */
export const PUBLISH_INTERVAL_MS = 100;

/** Wheel inactivity before a wheel zoom counts as settled, in milliseconds. */
export const WHEEL_SETTLE_MS = 150;

/** Mouse movement, in pixels, that turns a press into a pan. */
export const DRAG_THRESHOLD_MOUSE_PX = 4;

/** Touch movement, in pixels, that turns a press into a pan. */
export const DRAG_THRESHOLD_TOUCH_PX = 8;

/** How far, in views, the view center may move beyond the bounds. */
export const BOUNDS_VIEW_MARGIN = 0.5;

/** Arrow key pan distance, as a fraction of the view. */
export const KEYBOARD_PAN_FRACTION = 0.1;

/** Zoom change per plus or minus key press. */
export const KEYBOARD_ZOOM_FACTOR = 1.25;

/** Zoom change per pixel of wheel delta. Starting value. */
export const WHEEL_ZOOM_SENSITIVITY = 0.002;

/** Zoom change per pixel of trackpad pinch delta (wheel with ctrlKey). Starting value. */
export const PINCH_ZOOM_SENSITIVITY = 0.01;

/** Pixels per line when a wheel event reports its delta in lines. */
export const WHEEL_LINE_HEIGHT_PX = 16;

/** Pixels per page when a wheel event reports its delta in pages. */
export const WHEEL_PAGE_HEIGHT_PX = 400;

/** Zoom used when there is no viewport, default viewport, or bounds to fit. */
export const DEFAULT_ZOOM = 1;
