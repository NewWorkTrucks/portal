import { PROFILE_PHOTO_SIZE_PX } from "@/constants/profile-photos";

const PROFILE_PHOTO_QUALITY = 0.85;

/**
 * Center-crops an image to a square and shrinks it to PROFILE_PHOTO_SIZE_PX, as WebP (or PNG on
 * browsers that can't encode WebP). Keeps uploads to a few dozen KB whatever the original size.
 */
export async function shrinkProfilePhoto(photoFile: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(photoFile);
  const sideLength = Math.min(imageBitmap.width, imageBitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_PHOTO_SIZE_PX;
  canvas.height = PROFILE_PHOTO_SIZE_PX;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser can't resize images.");
  }
  context.drawImage(
    imageBitmap,
    (imageBitmap.width - sideLength) / 2,
    (imageBitmap.height - sideLength) / 2,
    sideLength,
    sideLength,
    0,
    0,
    PROFILE_PHOTO_SIZE_PX,
    PROFILE_PHOTO_SIZE_PX,
  );
  imageBitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (photoBlob) => (photoBlob ? resolve(photoBlob) : reject(new Error("Couldn't process that image."))),
      "image/webp",
      PROFILE_PHOTO_QUALITY,
    ),
  );
}
