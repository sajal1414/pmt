from collections import defaultdict
from app.db import SessionLocal
from app.models import Course, Lesson


def deduplicate_database_lessons():
    session = SessionLocal()
    try:
        courses = session.query(Course).order_by(Course.id.asc()).all()
        total_deleted = 0

        print(f"Checking {len(courses)} courses for duplicate lessons...")

        for c in courses:
            lessons = session.query(Lesson).filter_by(course_id=c.id).order_by(Lesson.id.asc()).all()
            if not lessons:
                continue

            seen_titles = set()
            unique_lessons = []

            for l in lessons:
                clean_title = (l.title or "").strip().lower()
                # If seen before, delete this duplicate lesson
                if clean_title in seen_titles:
                    session.delete(l)
                    total_deleted += 1
                    print(f"  Deleted duplicate lesson [{c.nfolks_course_code}] ID={l.id}: '{l.title}'")
                else:
                    seen_titles.add(clean_title)
                    unique_lessons.append(l)

            # Renumber sequence orders cleanly 1..N
            for seq, l in enumerate(unique_lessons, start=1):
                l.sequence_order = seq

        session.commit()
        print(f"\nDeduplication complete: {total_deleted} duplicate lessons removed!")

        # Verify
        remaining = session.query(Lesson).count()
        print(f"Total unique lessons remaining in database: {remaining}")

        for c in courses:
            l_count = session.query(Lesson).filter_by(course_id=c.id).count()
            print(f"  {c.nfolks_course_code}: {l_count} lessons")

    finally:
        session.close()


if __name__ == "__main__":
    deduplicate_database_lessons()
