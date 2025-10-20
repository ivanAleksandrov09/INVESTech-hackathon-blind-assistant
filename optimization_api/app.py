import base64
from io import BytesIO
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel

app = FastAPI()

# we store the last embedding in the local memory
last_embedding: Optional[np.ndarray] = None

SIMILARITY_THRESHOLD = 0.95

class ThumbRequest(BaseModel):
    image_base64: str

class ThumbResponse(BaseModel):
    shouldUpload: bool
    reason: Optional[str] = None

def img_to_embedding(b64: str, size=(32, 32)) -> np.ndarray:
    # decode the b64 string
    data = base64.b64decode(b64)

    # load the image and convert to RGB
    img = Image.open(BytesIO(data)).convert("RGB").resize(size)
    
    # convert to numpy array
    img_array = np.asarray(img).astype(np.float32)

    embedding = img_array.flatten()

    # normalize the embedding
    normalized_embedding = np.linalg.norm(embedding)

    # 1e-8 to avoid division by zero
    return embedding / (normalized_embedding + 1e-8)

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

@app.post("/should_upload", response_model=ThumbResponse)
async def should_upload(req: ThumbRequest):
    global last_embedding

    try:
        embedding = img_to_embedding(req.image_base64)
    except Exception as e:
        return {"shouldUpload": True, "reason": f"decode-error: {e}"}
    
    if last_embedding is None:
        last_embedding = embedding
        return {"shouldUpload": True, "reason": "no-previous"}
    
    similarity = cosine_similarity(embedding, last_embedding)

    if similarity < SIMILARITY_THRESHOLD:
        last_embedding = embedding
        print("uploading new picture")
        return {"shouldUpload": True, "reason": f"diff(sim={similarity:.3f})"}
    else:
        return {"shouldUpload": False, "reason": f"similar(sim={similarity:.3f})"}
    
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)