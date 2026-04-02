import os
from flask import Flask, jsonify, request
from flask_cors import CORS

print("🚀 APP STARTING...")

app = Flask(__name__)
CORS(app)

# ========================
# BLUEPRINT IMPORT SAFE
# ========================
try:
    from src.module.auth import auth_bp
    from src.module.tts import tts_bp
    from src.module.message import messages_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(tts_bp, url_prefix="/tts")
    app.register_blueprint(messages_bp, url_prefix="/messages")

    print("✅ Blueprints loaded")

except Exception as e:
    print("❌ Blueprint error:", e)


# ========================
# AI IMPORT SAFE (NEW)
# ========================
try:
    from src.module.ai_service import enhance_text
    AI_AVAILABLE = True
    print("✅ AI service loaded")
except Exception as e:
    AI_AVAILABLE = False
    print("❌ AI service not loaded:", e)


# ========================
# ROOT
# ========================
@app.route("/")
def home():
    return jsonify({"message": "API working 🚀"})


# ========================
# HEALTH CHECK
# ========================
@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend running 🚀"
    })


# ========================
# 🔥 AI TEXT ENHANCER ROUTE (MAIN FIX)
# ========================
@app.route("/enhance", methods=["POST"])
def enhance():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON body"}), 400

        text = data.get("text", "")

        if not text:
            return jsonify({"success": False, "error": "Text is empty"}), 400

        if not AI_AVAILABLE:
            return jsonify({
                "success": False,
                "error": "AI service not available"
            }), 500

        result = enhance_text(text)

        return jsonify({
            "success": True,
            "original": text,
            "enhanced": result
        })

    except Exception as e:
        print("🔥 Enhance error:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ========================
# DEBUG ROUTES
# ========================
@app.route("/debug")
def debug():
    return jsonify({
        "routes": [str(r) for r in app.url_map.iter_rules()]
    })


# ========================
# ERROR HANDLERS
# ========================
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "success": False,
        "error": "Route not found"
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({
        "success": False,
        "error": "Method not allowed (check POST/GET)"
    }), 405


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "success": False,
        "error": "Server error"
    }), 500


# ========================
# RUN
# ========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)