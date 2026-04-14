import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firebaseApp, isFirebaseEnabled } from "./firebase";

function getStorageInstance() {
  if (!firebaseApp) throw new Error("Firebase is not configured");
  return getStorage(firebaseApp);
}

/**
 * Uploads an image file to Firebase Storage and returns its public download URL.
 * Path: users/{uid}/{slot}  (slot = 'logo' | 'qrCode')
 */
export async function uploadImage(
  uid: string,
  slot: "logo" | "qrCode",
  file: File,
): Promise<string> {
  const storage = getStorageInstance();
  const fileRef = ref(storage, `users/${uid}/${slot}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/**
 * Deletes the stored image from Firebase Storage.
 * Safe to call even if the file doesn't exist (ignores not-found errors).
 */
export async function deleteImage(
  uid: string,
  slot: "logo" | "qrCode",
): Promise<void> {
  const storage = getStorageInstance();
  const fileRef = ref(storage, `users/${uid}/${slot}`);
  try {
    await deleteObject(fileRef);
  } catch (err: unknown) {
    // Ignore "object not found" — already deleted or never uploaded
    if ((err as { code?: string })?.code !== "storage/object-not-found")
      throw err;
  }
}

export { isFirebaseEnabled };
