import psycopg2

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="stress_db",
            user="postgres",
            password="saloni1234"
        )
        print("✅ Database connected")
        return conn
    except Exception as e:
        print("❌ DB Error:", e)
        return None