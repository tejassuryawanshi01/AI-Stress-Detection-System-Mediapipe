import os

from dotenv import load_dotenv
import psycopg2

load_dotenv()


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            port=os.environ.get("DB_PORT", "5432"),
            database=os.environ.get("DB_NAME", "stress_db"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD")
        )

        print("✅ Database connected")
        return conn

    except Exception as e:
        print("❌ DB Error:", e)
        return None