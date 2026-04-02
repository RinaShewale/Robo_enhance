# src/module/auth.py

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.database import get_conn

import jwt
import datetime

auth_bp = Blueprint("auth", __name__)

# 🔐 SECRET KEY (move to .env in production)
SECRET_KEY = "robo_enhance_secret_123"


# ========================
# 🔥 TOKEN VERIFY HELPER
# ========================
def verify_token(req):
    auth_header = req.headers.get("Authorization")

    if not auth_header:
        return None

    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded["user_id"]

    except Exception as e:
        print("Token error:", e)
        return None


# ========================
# 🟢 REGISTER
# ========================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    conn = get_conn()

    try:
        with conn.cursor() as cursor:

            # check duplicate email
            cursor.execute(
                "SELECT id FROM public.users WHERE LOWER(email)=%s",
                (email,)
            )

            if cursor.fetchone():
                return jsonify({"error": "Email already registered"}), 400

            # hash password
            hashed_password = generate_password_hash(password)

            cursor.execute(
                """
                INSERT INTO public.users (username, email, password)
                VALUES (%s, %s, %s)
                RETURNING id;
                """,
                (username, email, hashed_password)
            )

            user_id = cursor.fetchone()[0]
            conn.commit()

        return jsonify({
            "message": "User registered successfully",
            "user_id": user_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ========================
# 🔵 LOGIN (JWT TOKEN)
# ========================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = get_conn()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, username, email, password
                FROM public.users
                WHERE LOWER(email)=%s
                """,
                (email,)
            )

            user = cursor.fetchone()

        if user and check_password_hash(user[3], password):

            # 🔥 JWT TOKEN CREATE
            token = jwt.encode({
                "user_id": user[0],
                "email": user[2],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, SECRET_KEY, algorithm="HS256")

            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user[0],
                    "username": user[1],
                    "email": user[2]
                }
            }), 200

        return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ========================
# 🟡 UPDATE PROFILE
# ========================
@auth_bp.route("/update_profile", methods=["PUT"])
def update_profile():

    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not username or not email:
        return jsonify({"error": "All fields required"}), 400

    conn = get_conn()

    try:
        with conn.cursor() as cursor:

            # check current email
            cursor.execute(
                "SELECT email FROM public.users WHERE id=%s",
                (user_id,)
            )

            current_user = cursor.fetchone()

            if not current_user:
                return jsonify({"error": "User not found"}), 404

            current_email = (current_user[0] or "").lower()

            # email already exists check
            if email != current_email:
                cursor.execute(
                    "SELECT id FROM public.users WHERE LOWER(email)=%s",
                    (email,)
                )

                if cursor.fetchone():
                    return jsonify({"error": "Email already in use"}), 400

            # update
            cursor.execute(
                """
                UPDATE public.users
                SET username=%s, email=%s
                WHERE id=%s
                RETURNING id, username, email;
                """,
                (username, email, user_id)
            )

            updated_user = cursor.fetchone()
            conn.commit()

        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user[0],
                "username": updated_user[1],
                "email": updated_user[2]
            }
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ========================
# 🔴 LOGOUT (frontend handles token remove)
# ========================
@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logout successful"}), 200