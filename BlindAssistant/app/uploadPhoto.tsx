import { File } from "expo-file-system";

const SERVER_HOST = "10.226.105.187:8001";

async function uploadPhoto(uri: string) {
  try {
    // Read file as binary
    if (!uri) {
      console.error("No URI provided for upload.");
      return;
    }

    const file = new File(uri);
    const b64 = await file.base64();

    const response = await fetch(`http://${SERVER_HOST}/should_upload`, {
      method: "POST",
      body: JSON.stringify({ image_base64: b64 }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Upload response:", data);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}


export default uploadPhoto;