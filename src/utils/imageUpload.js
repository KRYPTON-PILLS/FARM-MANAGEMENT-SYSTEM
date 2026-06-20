/**
 * imageUpload.js — Reusable image upload utility
 * 
 * Used by: Animals.jsx, Cattle.jsx, Sheep.jsx, Goats.jsx, Pigs.jsx,
 *          Poultry.jsx, Bulls.jsx, BullsProfile.jsx, Crops.jsx,
 *          and any other page that handles image uploads.
 *
 * Usage:
 *   import { uploadImage } from "../utils/imageUpload.js";
 *
 *   const url = await uploadImage(file, "covers/cattle");
 *   // url is a permanent Firebase Storage download URL
 */

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebaseConfig.js";

// ─────────────────────────────────────────────
// COMPRESS & RESIZE
// Reduces file size before uploading to Storage
// ─────────────────────────────────────────────

/**
 * Compresses and resizes an image file.
 * @param {File} file         - Original image file
 * @param {number} maxWidth   - Max width in pixels (default 800)
 * @param {number} quality    - JPEG quality 0-1 (default 0.82)
 * @returns {Promise<Blob>}   - Compressed image blob
 */
export async function compressImage(file, maxWidth = 800, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        quality
      );
    };

    img.src = url;
  });
}

// ─────────────────────────────────────────────
// UPLOAD IMAGE
// Compresses then uploads to Firebase Storage
// Returns a permanent download URL
// ─────────────────────────────────────────────

/**
 * Compresses and uploads an image to Firebase Storage.
 *
 * @param {File}     file           - Image file from input[type=file]
 * @param {string}   storagePath    - Base path in Storage e.g. "covers/cattle"
 * @param {object}   options
 * @param {number}   options.maxWidth  - Max width px (default 800)
 * @param {number}   options.quality   - JPEG quality (default 0.82)
 * @param {Function} options.onProgress - Called with 0-100 progress number
 *
 * @returns {Promise<string>} Permanent download URL
 *
 * @example
 * // Cover image
 * const url = await uploadImage(file, "covers/cattle/bulls");
 *
 * // Animal profile photo (smaller)
 * const url = await uploadImage(file, "animals/cattle", { maxWidth: 600 });
 *
 * // With progress tracking
 * const url = await uploadImage(file, "crops", {
 *   onProgress: (pct) => setProgress(pct)
 * });
 */
export async function uploadImage(file, storagePath, options = {}) {
  const {
    maxWidth    = 800,
    quality     = 0.82,
    onProgress  = null,
  } = options;

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User must be logged in to upload images");

  // 1. Compress the image
  const compressed = await compressImage(file, maxWidth, quality);

  // 2. Build the full storage path
  //    e.g. covers/cattle/bulls/{uid}/{timestamp}.jpg
  const fullPath = `${storagePath}/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, fullPath);

  // 3. Upload with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressed);

    uploadTask.on(
      "state_changed",

      // Progress
      (snapshot) => {
        if (onProgress) {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(pct);
        }
      },

      // Error
      (error) => {
        console.error("Image upload failed:", error);
        reject(error);
      },

      // Success — return the permanent download URL
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

// ─────────────────────────────────────────────
// PRESET UPLOADERS (convenience wrappers)
// ─────────────────────────────────────────────

/**
 * Upload a category cover image (Animals page, Cattle page, etc.)
 * Max 1000px wide — good quality for full-bleed card images.
 */
export const uploadCoverImage = (file, category, onProgress) =>
  uploadImage(file, `covers/${category}`, { maxWidth: 1000, quality: 0.85, onProgress });

/**
 * Upload an individual animal's profile photo.
 * Max 600px wide — smaller since it's shown in a card/profile view.
 */
export const uploadAnimalPhoto = (file, animalType, onProgress) =>
  uploadImage(file, `animals/${animalType}`, { maxWidth: 600, quality: 0.82, onProgress });

/**
 * Upload a crop image.
 * Max 800px wide.
 */
export const uploadCropImage = (file, onProgress) =>
  uploadImage(file, "crops", { maxWidth: 800, quality: 0.82, onProgress });

/**
 * Upload a user profile photo.
 * Max 400px wide — small since it's shown as an avatar.
 */
export const uploadProfilePhoto = (file, onProgress) =>
  uploadImage(file, "profiles", { maxWidth: 400, quality: 0.85, onProgress });