import { File } from "expo-file-system";

const FASTAPI_SERVER_HOST = "10.226.105.159:8001";
const FLASK_SERVER_HOST = "10.226.105.188:5000";

interface Detection {
  box: Array<number>;
  class: string;
  confidence: number;
}

export default async function uploadPhoto(uri: string): Promise<string[] | null> {
  try {
    // Read file as binary
    if (!uri) {
      console.error("No URI provided for upload.");
      return null;
    }

    const file = new File(uri);
    const b64 = await file.base64();

    const response = await fetch(`http://${FASTAPI_SERVER_HOST}/should_upload`, {
      method: "POST",
      body: JSON.stringify({ image_base64: b64 }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // if (response.json()["shouldUpload"] === true) {
    //   console.log("Server indicated to upload the photo.");
    // }
  
    
    const data = await response.json();

    if (data["shouldUpload"] === true) {
      const res2 = await fetch(`http://${FLASK_SERVER_HOST}/detect`, {
        method: "POST",
        body: JSON.stringify({ image: b64 }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data2 = await res2.json();

      if (Array.isArray(data2["detections"])) {
        let objectNames: string[] = [];
        data2["detections"].forEach((detection: Detection) => {
          if (detection.confidence >= 0.5) {
            objectNames.push(detection.class);
          }
        });
        return objectNames;
      } else {
        return null;
      }
    } else {
      return null;
    }
    // console.log("Server response:", data);
  } catch (error) {
    console.error("Error uploading photo:", error);
    return null;
  }
}