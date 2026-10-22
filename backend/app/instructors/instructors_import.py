import re
from decimal import Decimal

from app.models import TravelPreference

COLUMN_MAP_NORMALIZED = {
    "name": "name",
    "instructor": "name",
    "instructor name": "name",
    "full name": "name",
    "fullname": "name",
    "skills/products": "skills_products",
    "skills / products": "skills_products",
    "skills": "skills_products",
    "skill": "skills_products",
    "skills & products": "skills_products",
    "products & skills": "skills_products",
    "skills and products": "skills_products",
    "email id": "email",
    "email": "email",
    "email_id": "email",
    "email address": "email",
    "e-mail": "email",
    "e-mail id": "email",
    "contact email": "email",
    "location": "location",
    "country": "location",
    "city": "location",
    "region": "location",
    "languages they teach": "languages",
    "languages": "languages",
    "language": "languages",
    "languages taught": "languages",
    "teaching languages": "languages",
    "travel preference": "travel_preference",
    "travel": "travel_preference",
    "travel_preference": "travel_preference",
    "can travel": "travel_preference",
    "vendor": "vendor",
    "company": "vendor",
    "organization": "vendor",
    "platform": "platform",
    "domain": "platform",
    "category": "platform",
    "portfolio": "portfolio",
    "product": "product",
    "courses can teach": "courses_can_teach",
    "courses_can_teach": "courses_can_teach",
    "courses": "courses_can_teach",
    "can teach": "courses_can_teach",
    "feedback score": "feedback_score",
    "feedback_score": "feedback_score",
    "feedback": "feedback_score",
    "rating": "feedback_score",
    "score": "feedback_score",
    "comments": "comments",
    "comment": "comments",
    "notes": "comments",
    "remarks": "comments",
}

TRAVEL_PREFERENCE_MAP = {
    "yes": TravelPreference.can_travel,
    "y": TravelPreference.can_travel,
    "can_travel": TravelPreference.can_travel,
    "can travel": TravelPreference.can_travel,
    "true": TravelPreference.can_travel,
    "no": TravelPreference.virtual_only,
    "n": TravelPreference.virtual_only,
    "virtual": TravelPreference.virtual_only,
    "virtual only": TravelPreference.virtual_only,
    "virtual_only": TravelPreference.virtual_only,
    "false": TravelPreference.virtual_only,
    "in person": TravelPreference.in_person_only,
    "in-person": TravelPreference.in_person_only,
    "in_person": TravelPreference.in_person_only,
    "in_person_only": TravelPreference.in_person_only,
    "both": TravelPreference.both,
    "all": TravelPreference.both,
}


def clean_instructor_email(raw_email: str | None, name: str) -> tuple[str, str | None]:
    """Clean email string, handling multiple comma/semicolon emails, mailto: prefix, and fallback."""
    if not raw_email or not str(raw_email).strip():
        slug = re.sub(r"[^a-z0-9]+", ".", name.strip().lower()).strip(".")
        if not slug:
            slug = "instructor"
        return f"{slug}@nfolksdata.com", None

    e = str(raw_email).strip().lower()
    if e.startswith("mailto:"):
        e = e[7:].strip()

    secondary = None
    if "," in e:
        parts = [p.strip() for p in e.split(",") if p.strip()]
        e = parts[0]
        if len(parts) > 1:
            secondary = parts[1]
    elif ";" in e:
        parts = [p.strip() for p in e.split(";") if p.strip()]
        e = parts[0]
        if len(parts) > 1:
            secondary = parts[1]

    # Remove any trailing periods or unusual punctuation
    e = e.strip(".,;: ")
    return e, secondary


def map_instructor_row(row: dict) -> dict:
    """Map one spreadsheet row dictionary to Instructor fields."""
    fields = {}
    secondary_email = None

    for header, value in row.items():
        if header is None or value is None or str(value).strip() == "":
            continue

        clean_header = str(header).strip().lower()
        field = COLUMN_MAP_NORMALIZED.get(clean_header)
        if field is None:
            continue

        clean_v = str(value).replace("\xa0", " ").strip()
        if not clean_v:
            continue

        if field == "travel_preference":
            fields[field] = TRAVEL_PREFERENCE_MAP.get(clean_v.lower(), TravelPreference.can_travel)
        elif field == "email":
            primary_e, sec_e = clean_instructor_email(clean_v, str(row.get("Name") or row.get("name") or ""))
            fields[field] = primary_e
            secondary_email = sec_e
        elif field == "feedback_score":
            try:
                fields[field] = Decimal(str(clean_v).replace(",", "."))
            except Exception:
                pass
        else:
            # Strip trailing comma from skills/products if present
            if field in ("skills_products", "courses_can_teach"):
                clean_v = clean_v.rstrip(",").strip()
            fields[field] = clean_v

    name = fields.get("name")
    if name and not fields.get("email"):
        primary_e, _ = clean_instructor_email(None, name)
        fields["email"] = primary_e

    if secondary_email:
        alt_note = f"Alt email: {secondary_email}"
        if fields.get("comments"):
            fields["comments"] = f"{fields['comments']}; {alt_note}"
        else:
            fields["comments"] = alt_note

    return fields
