import os, sys
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS

# ===== Fix path for modules =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "src"))

# ===== Import blueprints =====
from module.auth import auth_bp
from module.tts import tts_bp
from module.message import messages_bp

# ===== Database =====
from src.database import get_conn

# ===== AI (SAFE IMPORT) =====
try:
    from module.ai_service import enhance_text
    AI_AVAILABLE = True
    print("✅ AI Loaded")
except Exception as e:
    AI_AVAILABLE = False
    print("❌ AI Error:", e)

# ===== Auto-create tables =====
def init_db():
    try:
        conn = get_conn()
        with conn.cursor() as cursor:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.tts_logs (
                id SERIAL PRIMARY KEY,
                user_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            conn.commit()
        print("[DB] Tables ensured ✅")
    except Exception as e:
        print("[DB] Error:", e)
    finally:
        conn.close()

init_db()

# ===== Flask app =====
app = Flask(
    __name__,
    # 🔥 IMPORTANT FIX (documentation folder target)
    static_folder=os.path.join(BASE_DIR, "../Frontend/documentation")
)

CORS(app, resources={r"/*": {"origins": "*"}})

# ===== SECURITY HEADERS =====
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ===== Register blueprints =====
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(tts_bp, url_prefix="/tts")
app.register_blueprint(messages_bp, url_prefix="/messages")

# ===== FRONTEND SERVE (FIXED) =====
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    try:
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)

        # 👉 default index.html
        return send_from_directory(app.static_folder, "index.html")

    except Exception as e:
        print("❌ Frontend error:", e)
        return jsonify({"error": "Frontend load error"}), 500


# ===== 🔥 AI ENHANCE ROUTE =====
@app.route("/enhance", methods=["POST"])
def enhance():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON"}), 400

        text = data.get("text", "")

        if not text:
            return jsonify({"success": False, "error": "Empty text"}), 400

        if not AI_AVAILABLE:
            return jsonify({"success": False, "error": "AI not available"}), 500

        result = enhance_text(text)

        return jsonify({
            "success": True,
            "original": text,
            "enhanced": result
        })

    except Exception as e:
        print("🔥 Enhance error:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# ===== HEALTH =====
@app.route("/health")
def health():
    return jsonify({"status": "ok 🚀"})


# ===== RUN =====
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(debug=debug_mode, host="0.0.0.0", port=port)