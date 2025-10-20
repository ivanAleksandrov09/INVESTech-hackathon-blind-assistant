import json
from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import os
import io
import base64
import numpy as np
from flask import Flask, request, jsonify
from google import genai
from PIL import Image  


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

model = YOLO("yolo11l.pt")



@app.route('/commands', methods=['POST'])
def commands():
    try:
        image_file = request.get_json()['image_b64']

        if not image_file:
            return jsonify({"error": "Missing image file ('photo')"}), 400



        image_bytes = io.BytesIO(base64.b64decode(image_file))
        ai_uploaded_file = client.files.upload(
            file=(image_bytes),
            config={"mime_type": "image/jpeg"},
        )

        if not ai_uploaded_file:
            return jsonify({"error": "Failed to upload image"}), 500

        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                ai_uploaded_file,
                "Describe the image briefly as if you were talking directly with a blind person (very short, one or two sentences). Start replying to the person right away without saying anything about the image upload."
            ],
            config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "A brief description of the image for a blind person."
                        }
                    },
                    "required": ["description"]
                },
            },
        )

        return jsonify({"response": json.loads(response.text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return "YOLOv8 Object Detection API is running."

@app.route('/detect', methods=['POST'])
def detect():
    try:
        # Get JSON and extract base64 image
        data = request.get_json()
        image_b64 = data.get('image')

        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        # Decode base64 -> bytes -> Image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Run YOLOv8 inference
        results = model.predict(image)

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            detections.append({
                "class": model.names[cls_id],
                "confidence": round(conf, 3),
                "box": [round(x, 2) for x in xyxy]
            })

        return jsonify({"detections": detections})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
