import os

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_db_connection

print("🔥 APP STARTED")

app = Flask(__name__)

# ---------------- SECRET KEY ----------------
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")

# ---------------- CORS ----------------
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://ai-stress-detection-system-mediapipe-1.onrender.com"
    ]
)

# ---------------- SESSION SETTINGS ----------------
app.config.update(
    SESSION_COOKIE_NAME="stress_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_PATH="/"
)


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "All fields required"}), 400

    conn = get_db_connection()

    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cur = None

    try:
        cur = conn.cursor()

        cur.execute(
            "SELECT * FROM users WHERE username = %s OR email = %s",
            (username, email)
        )

        user = cur.fetchone()

        if user:
            return jsonify({
                "message": "User or Email already exists"
            }), 400

        hashed_password = generate_password_hash(password)

        cur.execute(
            """
            INSERT INTO users (username, email, password)
            VALUES (%s, %s, %s)
            """,
            (username, email, hashed_password)
        )

        conn.commit()

        return jsonify({
            "message": "Registered successfully"
        }), 201

    except Exception as e:
        conn.rollback()
        print("❌ Register Error:", e)

        return jsonify({
            "message": "Registration failed"
        }), 500

    finally:
        if cur:
            cur.close()
        conn.close()


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "All fields required"}), 400

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "message": "Database connection failed"
        }), 500

    cur = None

    try:
        cur = conn.cursor()

        cur.execute(
            "SELECT * FROM users WHERE username = %s OR email = %s",
            (username, username)
        )

        user = cur.fetchone()

        if user and check_password_hash(user[3], password):

            # Create new session
            session.clear()
            session["user"] = user[1]

            print("✅ LOGIN SUCCESS:", user[1])
            print("✅ SESSION USER:", session.get("user"))

            return jsonify({
                "message": "Login successful",
                "user": user[1]
            }), 200

        return jsonify({
            "message": "Invalid credentials"
        }), 401

    except Exception as e:
        print("❌ Login Error:", e)

        return jsonify({
            "message": "Login failed"
        }), 500

    finally:
        if cur:
            cur.close()
        conn.close()

# ---------------- LOGOUT ----------------
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out"
    }), 200

# ---------------- CHECK SESSION ----------------
@app.route("/check", methods=["GET"])
def check():
    user = session.get("user")

    print("🔍 CHECK SESSION:", user)

    if user:
        return jsonify({
            "user": user
        }), 200

    return jsonify({
        "user": None
    }), 200

# ---------------- HOME ----------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Stress Detection Backend is running"
    }), 200

# ---------------- RUN ----------------
if __name__ == "__main__":
    print("🚀 Server started")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )