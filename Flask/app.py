from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import os
import io
import base64
import numpy as np

app = Flask(__name__)

model = YOLO("yolo11n.pt")

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

