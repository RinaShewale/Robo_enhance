from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.database import get_conn
from dotenv import load_dotenv
import os
import jwt
import datetime

# ======================
# ENV LOAD
# ======================
load_dotenv()

auth_bp = Blueprint("auth", __name__)

# 🔐 SAFE SECRET KEY CHECK
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise Exception("JWT_SECRET_KEY missing in .env file")

JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", 7))


# ======================
# TOKEN GENERATOR
# ======================
def generate_token(user):
    payload = {
        "user_id": user[0],
        "username": user[1],
        "email": user[2],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXP_DAYS)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


# ======================
# VERIFY TOKEN
# ======================
def verify_token(token):
    try:
        if not token:
            return None

        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ======================
# REGISTER
# ======================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    conn = get_conn()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM public.users WHERE LOWER(email)=%s",
                (email,)
            )

            if cursor.fetchone():
                return jsonify({"error": "Email already exists"}), 400

            hashed_password = generate_password_hash(password)

            cursor.execute(
                """
                INSERT INTO public.users (username, email, password)
                VALUES (%s, %s, %s)
                RETURNING id, username, email;
                """,
                (username, email, hashed_password)
            )

            user = cursor.fetchone()
            conn.commit()

        return jsonify({
            "message": "User registered",
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2]
            }
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ======================
# LOGIN
# ======================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email & password required"}), 400

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

            token = generate_token(user)

            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user[0],
                    "username": user[1],
                    "email": user[2]
                }
            }), 200

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ======================
# GET USER (ME)
# ======================
@auth_bp.route("/me", methods=["GET"])
def me():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token missing"}), 401

    token = token.replace("Bearer ", "")
    user = verify_token(token)

    if not user:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({"user": user}), 200


# ======================
# UPDATE PROFILE
# ======================
@auth_bp.route("/update_profile", methods=["PUT"])
def update_profile():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token required"}), 401

    token = token.replace("Bearer ", "")
    user_data = verify_token(token)

    if not user_data:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not username or not email:
        return jsonify({"error": "Invalid input"}), 400

    conn = get_conn()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                UPDATE public.users
                SET username=%s, email=%s
                WHERE id=%s
                RETURNING id, username, email;
                """,
                (username, email, user_data["user_id"])
            )

            updated = cursor.fetchone()
            conn.commit()

        return jsonify({
            "message": "Profile updated",
            "user": {
                "id": updated[0],
                "username": updated[1],
                "email": updated[2]
            }
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ======================
# LOGOUT (CLIENT SIDE)
# ======================
@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"}), 200