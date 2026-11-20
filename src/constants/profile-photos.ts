export const PROFILE_PHOTO_BUCKET = "profile-photos";
/** Photos are cropped to a square of this many pixels before upload. */
export const PROFILE_PHOTO_SIZE_PX = 256;
/** Largest original we accept before shrinking it. */
export const MAX_PROFILE_PHOTO_INPUT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Signed photo links last a day; they're made again on every page load. */
export const PROFILE_PHOTO_URL_LIFETIME_SECONDS = 60 * 60 * 24;
