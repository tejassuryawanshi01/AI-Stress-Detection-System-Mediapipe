import os
import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import get_db_connection


# =========================================================
# SIMPLE JWT IMPLEMENTATION
# =========================================================

class _JWTError(Exception):
    pass


class _ExpiredSignatureError(_JWTError):
    pass


class _InvalidTokenError(_JWTError):
    pass


class _JWT:

    ExpiredSignatureError = _ExpiredSignatureError
    InvalidTokenError = _InvalidTokenError

    @staticmethod
    def _encode_part(value):

        return base64.urlsafe_b64encode(
            json.dumps(
                value,
                separators=(",", ":")
            ).encode("utf-8")
        ).rstrip(b"=").decode("ascii")


    @staticmethod
    def _decode_part(value):

        return json.loads(
            base64.urlsafe_b64decode(
                value +
                "=" * (-len(value) % 4)
            )
        )


    def encode(
        self,
        payload,
        key,
        algorithm="HS256"
    ):

        if algorithm != "HS256":
            raise _InvalidTokenError(
                "Unsupported algorithm"
            )

        header = self._encode_part({
            "alg": "HS256",
            "typ": "JWT"
        })

        body = self._encode_part(
            payload
        )

        message = (
            f"{header}.{body}"
        ).encode("ascii")

        signature = hmac.new(
            key.encode("utf-8"),
            message,
            hashlib.sha256
        ).digest()

        encoded_signature = (
            base64.urlsafe_b64encode(
                signature
            )
            .rstrip(b"=")
            .decode("ascii")
        )

        return (
            f"{header}.{body}."
            f"{encoded_signature}"
        )


    def decode(
        self,
        token,
        key,
        algorithms=None
    ):

        try:

            header_text, body_text, signature_text = (
                token.split(".")
            )

            header = self._decode_part(
                header_text
            )

            if (
                algorithms and
                header.get("alg")
                not in algorithms
            ):
                raise _InvalidTokenError(
                    "Unsupported algorithm"
                )

            expected = hmac.new(
                key.encode("utf-8"),
                f"{header_text}.{body_text}".encode("ascii"),
                hashlib.sha256
            ).digest()

            actual = base64.urlsafe_b64decode(
                signature_text +
                "=" * (-len(signature_text) % 4)
            )

            if not hmac.compare_digest(
                actual,
                expected
            ):
                raise _InvalidTokenError(
                    "Invalid signature"
                )

            payload = self._decode_part(
                body_text
            )

            if (
                payload.get("exp", 0)
                <
                datetime.now(
                    timezone.utc
                ).timestamp()
            ):
                raise _ExpiredSignatureError(
                    "Token expired"
                )

            return payload

        except (
            _ExpiredSignatureError,
            _InvalidTokenError
        ):
            raise

        except (
            ValueError,
            TypeError,
            KeyError,
            json.JSONDecodeError
        ):
            raise _InvalidTokenError(
                "Invalid token"
            )


jwt = _JWT()


# =========================================================
# APP
# =========================================================

print("🔥 APP STARTED")

app = Flask(__name__)


# =========================================================
# SECRET KEY
# =========================================================

SECRET_KEY = os.environ.get(
    "SECRET_KEY"
)

if not SECRET_KEY:

    print(
        "⚠️ WARNING: SECRET_KEY is not set in environment."
    )

    SECRET_KEY = "dev-secret-key"


# =========================================================
# CORS
# =========================================================

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://ai-stress-detection-system-mediapipe-1.onrender.com"
    ]
)


# =========================================================
# CREATE TOKEN
# =========================================================

def create_token(username):

    payload = {

        "user": username,

        "exp":
            datetime.now(
                timezone.utc
            )
            +
            timedelta(days=7)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm="HS256"
    )


# =========================================================
# VERIFY TOKEN
# =========================================================

def verify_token():

    auth_header = request.headers.get(
        "Authorization"
    )

    if not auth_header:
        return None

    if not auth_header.startswith(
        "Bearer "
    ):
        return None

    token = auth_header.split(
        " ",
        1
    )[1]

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        return payload.get("user")

    except jwt.ExpiredSignatureError:

        print(
            "❌ Token expired"
        )

        return None

    except jwt.InvalidTokenError:

        print(
            "❌ Invalid token"
        )

        return None


# =========================================================
# REGISTER
# =========================================================

@app.route(
    "/register",
    methods=["POST"]
)
def register():

    data = request.get_json()

    if not data:

        return jsonify({
            "message":
                "Invalid request"
        }), 400


    username = data.get(
        "username"
    )

    email = data.get(
        "email"
    )

    password = data.get(
        "password"
    )


    if (
        not username
        or not email
        or not password
    ):

        return jsonify({
            "message":
                "All fields required"
        }), 400


    conn = get_db_connection()

    if conn is None:

        return jsonify({
            "message":
                "Database connection failed"
        }), 500


    cur = None

    try:

        cur = conn.cursor()


        cur.execute(
            """
            SELECT *
            FROM users
            WHERE username = %s
            OR email = %s
            """,
            (
                username,
                email
            )
        )


        user = cur.fetchone()


        if user:

            return jsonify({
                "message":
                    "User or Email already exists"
            }), 400


        hashed_password = (
            generate_password_hash(
                password
            )
        )


        cur.execute(
            """
            INSERT INTO users
            (username, email, password)
            VALUES (%s, %s, %s)
            """,
            (
                username,
                email,
                hashed_password
            )
        )


        conn.commit()


        print(
            "✅ USER REGISTERED:",
            username
        )


        return jsonify({
            "message":
                "Registered successfully"
        }), 201


    except Exception as e:

        conn.rollback()

        print(
            "❌ Register Error:",
            e
        )

        return jsonify({
            "message":
                "Registration failed"
        }), 500


    finally:

        if cur:
            cur.close()

        conn.close()


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["POST"]
)
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "message":
                "Invalid request"
        }), 400


    username = data.get(
        "username"
    )

    password = data.get(
        "password"
    )


    if (
        not username
        or not password
    ):

        return jsonify({
            "message":
                "All fields required"
        }), 400


    conn = get_db_connection()

    if conn is None:

        return jsonify({
            "message":
                "Database connection failed"
        }), 500


    cur = None


    try:

        cur = conn.cursor()


        cur.execute(
            """
            SELECT *
            FROM users
            WHERE username = %s
            OR email = %s
            """,
            (
                username,
                username
            )
        )


        user = cur.fetchone()


        if not user:

            return jsonify({
                "message":
                    "Invalid credentials"
            }), 401


        if not check_password_hash(
            user[3],
            password
        ):

            return jsonify({
                "message":
                    "Invalid credentials"
            }), 401


        token = create_token(
            user[1]
        )


        print(
            "✅ LOGIN SUCCESS:",
            user[1]
        )


        return jsonify({

            "message":
                "Login successful",

            "user":
                user[1],

            "token":
                token

        }), 200


    except Exception as e:

        print(
            "❌ Login Error:",
            e
        )

        return jsonify({
            "message":
                "Login failed"
        }), 500


    finally:

        if cur:
            cur.close()

        conn.close()


# =========================================================
# CHECK LOGIN
# =========================================================

@app.route(
    "/check",
    methods=["GET"]
)
def check():

    user = verify_token()


    print(
        "🔍 TOKEN CHECK:",
        user
    )


    if user:

        return jsonify({
            "user":
                user
        }), 200


    return jsonify({
        "user":
            None
    }), 401


# =========================================================
# LOGOUT
# =========================================================

@app.route(
    "/logout",
    methods=["POST"]
)
def logout():

    return jsonify({
        "message":
            "Logged out"
    }), 200


# =========================================================
# HOME
# =========================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "message":
            "AI Stress Detection Backend is running"
    }), 200


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    print(
        "🚀 Server started"
    )

    app.run(
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=False
    )