from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_db_connection
print("🔥 APP STARTED")

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.secret_key = "secret123"


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "All fields required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cur = conn.cursor()

    # Check existing user/email
    cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
    user = cur.fetchone()

    if user:
        cur.close()
        conn.close()
        return jsonify({"message": "User or Email already exists"}), 400

    hashed_password = generate_password_hash(password)

    cur.execute(
        "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
        (username, email, hashed_password)
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Registered successfully"}), 201


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")  # or email
    password = data.get("password")

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cur = conn.cursor()

    # login using username OR email
    cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, username))
    user = cur.fetchone()

    cur.close()
    conn.close()

    if user and check_password_hash(user[3], password):
        session["user"] = user[1]   # username
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"message": "Invalid credentials"}), 401


# ---------------- LOGOUT ----------------
@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Logged out"})


# ---------------- CHECK ----------------
@app.route("/check", methods=["GET"])
def check():
    if "user" in session:
        return jsonify({"user": session["user"]})
    return jsonify({"user": None})


# ---------------- RUN ----------------
if __name__ == "__main__":
    print("🚀 Server started")
    app.run(debug=True)