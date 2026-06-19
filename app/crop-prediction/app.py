# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)  # allow all origins (safety: change in prod)

# ----- Load artifacts -----
with open("stacking_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

# Crop name mapping (used only for readability in front‑end)
crop_names = {
    "rice": "Lúa",
    "wheat": "Lúa mì",
    "corn": "Ngô",
    "cotton": "Bông",
    "coconut": "Dừa",
    "banana": "Chuối",
    "apple": "Táo",
}

@app.route("/", methods=["GET"])
def home():
    return "Crop Prediction API is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Validate JSON exists
        if not data:
            return jsonify({"error": "No JSON provided"}), 400

        # Extract and cast features (ensure all keys present)
        required = ["N", "P", "K", "ph", "temperature", "humidity", "rainfall"]
        inputs = []
        for key in required:
            if key not in data:
                return jsonify({"error": f"Missing key: {key}"}), 400
            try:
                inputs.append(float(data[key]))
            except ValueError:
                return jsonify({"error": f"Invalid value for {key}"}), 400

        # Convert to numpy and scale
        features = np.array(inputs).reshape(1, -1)
        scaled = scaler.transform(features)

        # Predict
        pred_label = model.predict(scaled)[0]
        pred_probs = model.predict_proba(scaled)[0]
        probabilities = {label: float(round(prob, 4)) for label, prob in zip(model.classes_, pred_probs)}

        return jsonify({
            "prediction": pred_label,
            "probabilities": probabilities,
            # Optionally: include readable name for front‑end
            "prediction_name": crop_names.get(pred_label, pred_label)
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    # Run on port 5000 during dev
    app.run(host="0.0.0.0", port=5000, debug=True)