// ...existing code...
import { File } from "expo-file-system";

let lastPhotoUri: string | null = null;

export const setLastPhotoUri = (uri: string | null) => {
  lastPhotoUri = uri;
};

export const getLastPhotoUri = () => lastPhotoUri;

/**
 * Resolve and return base64 for the last photo, or null if none.
 */
export const getLastPhotoBase64 = async (): Promise<string | null> => {
  if (!lastPhotoUri) return null;
  try {
    const file = new File(lastPhotoUri);
    const b64 = await file.base64();

    return b64;
  } catch (err) {
    console.error("Failed to read last photo as base64:", err);
    return null;
  }
};
// ...existing code...