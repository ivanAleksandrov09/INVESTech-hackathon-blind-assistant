from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import numpy as np
import torch, io, base64, os, sys

# Add ml_depth_pro/src to sys.path
ml_depth_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "ml_depth_pro", "src"))
if ml_depth_src not in sys.path:
    sys.path.insert(0, ml_depth_src)

# Import DepthPro factory function
try:
    
    from depth_pro import create_model_and_transforms

except Exception as import_err:
    print("ERROR: Failed to import depth_pro from:", ml_depth_src)
    print("sys.path (first 10 entries):", sys.path[:10])
    print("Import error:", import_err)
    raise

app = Flask(__name__)

# Load YOLO model
yolo_model = YOLO("yolo11n.pt")

# Determine device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Path to your local checkpoint
local_ckpt = os.path.join(os.path.dirname(__file__), "models", "depth_pro.pt")
if not os.path.exists(local_ckpt):
    raise FileNotFoundError(f"DepthPro checkpoint not found at: {local_ckpt}")


# Now create model and transforms
depth_model, depth_transform = create_model_and_transforms(device=device)



@app.route('/')
def index():
    return "YOLO + Depth API running."

@app.route('/detect', methods=['POST'])
def detect():
    try:
        # Decode base64 image from JSON
        data = request.get_json()
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"error": "No image provided"}), 400

        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        np_img = np.array(image)

        # YOLO inference
        yolo_results = yolo_model.predict(np_img)
        detections = []
        for box in yolo_results[0].boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            detections.append({
                "class": yolo_model.names[cls_id],
                "confidence": round(conf, 3),
                "box": [round(x, 2) for x in xyxy]
            })

        # DepthPro inference
        depth_map = depth_model(np_img)  # (H, W) numpy array

        # Ledge detection zones
        H, W = depth_map.shape
        band_bottom = depth_map[-60:, :]
        band_upper = depth_map[-150:-90, :]
        thirds = np.array_split(np.arange(W), 3)
        zone_names = ["left", "center", "right"]
        ledge_zones = []

        for i, zone in enumerate(thirds):
            mean_bottom = np.mean(band_bottom[:, zone])
            mean_upper = np.mean(band_upper[:, zone])
            diff = mean_bottom - mean_upper
            if diff > 0.5:  # adjustable threshold
                ledge_zones.append(zone_names[i])

        warning = f"⚠️ Ledge detected on: {', '.join(ledge_zones)}" if ledge_zones else "✅ Safe ground"

        return jsonify({
            "detections": detections,
            "ledge_warning": warning
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
