from sqlalchemy import text
from app.db import SessionLocal

with SessionLocal() as s:
    s.execute(text("UPDATE courses SET status = 'available' WHERE status IN ('published', 'available')"))
    s.execute(text("UPDATE courses SET status = 'in_development' WHERE status != 'available'"))
    s.commit()
    counts = s.execute(text("SELECT status, count(*) FROM courses GROUP BY status")).fetchall()
    print("New DB status counts:", counts)
