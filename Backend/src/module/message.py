from flask import Blueprint, request, jsonify
from src.database import get_conn
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

messages_bp = Blueprint("messages", __name__)

SECRET_KEY = os.getenv("SECRET_KEY")


# =========================
# 🔐 VERIFY TOKEN
# =========================
def verify_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except:
        return None


# =========================
# 💾 SAVE MESSAGE (SECURE)
# =========================
@messages_bp.route("/save_message", methods=["POST"])
def save_message():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    user = verify_token(token)

    if not user:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    message_text = data.get("message")

    if not message_text:
        return jsonify({"error": "Message required"}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO public.messages (user_id, message_text)
                VALUES (%s, %s)
                RETURNING id;
                """,
                (user["user_id"], message_text)
            )
            msg_id = cursor.fetchone()[0]
            conn.commit()

        return jsonify({
            "message": "Message saved",
            "id": msg_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# =========================
# 📩 GET MESSAGES (SECURE)
# =========================
@messages_bp.route("/get_messages", methods=["GET"])
def get_messages():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    user = verify_token(token)

    if not user:
        return jsonify({"error": "Invalid token"}), 401

    user_id = user["user_id"]

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, message_text, created_at
                FROM public.messages
                WHERE user_id=%s
                ORDER BY created_at ASC;
                """,
                (user_id,)
            )

            rows = cursor.fetchall()

        messages = [
            {
                "id": r[0],
                "message": r[1],
                "created_at": str(r[2])
            }
            for r in rows
        ]

        return jsonify(messages), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# =========================
# 🗑 DELETE SINGLE MESSAGE (SECURE)
# =========================
@messages_bp.route("/delete_message/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    user = verify_token(token)

    if not user:
        return jsonify({"error": "Invalid token"}), 401

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM public.messages
                WHERE id=%s AND user_id=%s
                RETURNING id;
                """,
                (message_id, user["user_id"])
            )

            deleted = cursor.fetchone()
            conn.commit()

        if deleted:
            return jsonify({"success": True, "id": message_id}), 200
        else:
            return jsonify({"success": False, "error": "Not found or not allowed"}), 404

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        conn.close()


# =========================
# 🧹 DELETE ALL MESSAGES (SECURE)
# =========================
@messages_bp.route("/delete_all", methods=["DELETE"])
def delete_all():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    user = verify_token(token)

    if not user:
        return jsonify({"error": "Invalid token"}), 401

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM public.messages WHERE user_id=%s;",
                (user["user_id"],)
            )
            conn.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        conn.close()