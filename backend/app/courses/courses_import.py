"""Column mapping + value normalization for bulk-importing the client's
`New Atlas Course Directory` sheet (36 columns) into CourseCreateRequest-shaped dicts.
"""

COLUMN_MAP = {
    "Vendor": "vendor",
    "Platform": "platform",
    "Portfolio": "portfolio",
    "Product": "product",
    "Course Code": "nfolks_course_code",
    "IBM Course Codes": "ibm_course_codes",
    "Status": "status",
    "Course Name": "course_name",
    "Course Outline Status": "course_outline_status",
    "Modality": "modality",
    "Duration (days)": "duration_days",
    "Number of Hours": "num_hours",
    "on IBM PMT": "on_ibm_pmt",
    "Lab Location (ITZ , nFolks, Instructor owned, N/A)": "lab_location",
    "IBM retirement date": "ibm_retirement_date",
    "IP Owner (nFolks, SubK)": "ip_owner",
    "Course Author Email": "course_author_email",
    "Planned Completion Date": "planned_completion_date",
    "Release Date": "release_date",
    "Retire Date": "retire_date",
    "Course Description": "course_description",
    "Link to Course Outline": "link_to_course_outline",
    "Skill Level": "skill_level",
    "Max students": "max_students",
    "Pre Reqs": "pre_reqs",
    "Persona": "persona_audience_type",
    "Lab Configuration": "lab_configuration",
    "Delivery Instruction Notes": "delivery_instruction_notes",
    "Instructor Daily rate": "instructor_daily_rate",
    "Materials Cost": "materials_cost",
    "Lab Cost": "lab_cost",
    "Learning Path": "learning_path",
    "Badge": "badge",
    "Certification": "certification",
    "Notes": "notes",
    "Record Source": "record_source",
    "Instructor": "instructor",
    "Instructors": "instructor",
    "Assigned Instructor": "instructor",
    "Assigned Instructors": "instructor",
}

_STATUS_MAP = {
    "available": "available",
    "in development": "in_development",
    "in-development": "in_development",
    "in_development": "in_development",
    "development": "in_development",
    "backlog": "backlog",
    "pipeline": "pipeline",
    "draft": "draft",
    "in-progress": "in_progress",
    "in_progress": "in_progress",
    "in progress": "in_progress",
    "for review": "for_review",
    "for_review": "for_review",
    "review": "for_review",
    "updated version": "updated_version",
    "updated_version": "updated_version",
    "custom": "custom",
    "published": "published",
    "active": "available",
    "live": "available",
    "lockheed": "lockheed",
    "retired": "retired",
    "retire": "retired",
    "archived": "retired",
    "archive": "retired",
    "inactive": "retired",
}

_SKILL_LEVEL_MAP = {
    "foundation": "foundational",
    "foundational": "foundational",
    "beginner": "foundational",
    "introductory": "foundational",
    "intermediate": "intermediate",
    "advanced": "advanced",
    "expert": "advanced",
}

_IP_OWNER_MAP = {
    "nfolks": "nFolks",
    "sub-k": "SubK",
    "subk": "SubK",
    "sub_k": "SubK",
}

_LAB_LOCATION_MAP = {
    "itz": "ITZ",
    "nfolks": "nFolks",
    "nfolks_lab": "nFolks",
    "nfolks lab": "nFolks",
    "instructor owned": "instructor_owned",
    "instructor_owned": "instructor_owned",
    "instructor": "instructor_owned",
    "n/a": "na",
    "na": "na",
    "none": "na",
}

_OUTLINE_STATUS_MAP = {
    "missing": "missing",
    "no outline": "missing",
    "no_outline": "missing",
    "none": "missing",
    "not yet scoped": "not_yet_scoped",
    "not_yet_scoped": "not_yet_scoped",
    "unscoped": "not_yet_scoped",
    "draft": "draft",
    "in progress": "draft",
    "in-progress": "draft",
    "partially complete": "partially_complete",
    "partially_complete": "partially_complete",
    "partial": "partially_complete",
    "validated": "validated",
    "completed": "validated",
    "complete": "validated",
    "ready": "validated",
}

COLUMN_MAP_NORMALIZED = {
    "id": "id",
    "course id": "id",
    "vendor": "vendor",
    "platform": "platform",
    "portfolio": "portfolio",
    "product": "product",
    "course code": "nfolks_course_code",
    "nfolks course code": "nfolks_course_code",
    "nfolks_course_code": "nfolks_course_code",
    "ibm course codes": "ibm_course_codes",
    "ibm course code": "ibm_course_codes",
    "status": "status",
    "course name": "course_name",
    "title": "course_name",
    "course outline status": "course_outline_status",
    "outline status": "course_outline_status",
    "modality": "modality",
    "duration (days)": "duration_days",
    "duration days": "duration_days",
    "days": "duration_days",
    "number of hours": "num_hours",
    "duration (hours)": "num_hours",
    "num_hours": "num_hours",
    "hours": "num_hours",
    "on ibm pmt": "on_ibm_pmt",
    "lab location": "lab_location",
    "lab location (itz , nfolks, instructor owned, n/a)": "lab_location",
    "ibm retirement date": "ibm_retirement_date",
    "ip owner": "ip_owner",
    "ip owner (nfolks, subk)": "ip_owner",
    "course author email": "course_author_email",
    "author email": "course_author_email",
    "planned completion date": "planned_completion_date",
    "release date": "release_date",
    "retire date": "retire_date",
    "course description": "course_description",
    "description": "course_description",
    "link to course outline": "link_to_course_outline",
    "skill level": "skill_level",
    "max students": "max_students",
    "pre reqs": "pre_reqs",
    "pre-reqs": "pre_reqs",
    "prereqs": "pre_reqs",
    "prerequisites": "pre_reqs",
    "persona": "persona_audience_type",
    "audience persona": "persona_audience_type",
    "audience": "persona_audience_type",
    "lab configuration": "lab_configuration",
    "delivery instruction notes": "delivery_instruction_notes",
    "delivery notes": "delivery_instruction_notes",
    "instructor daily rate": "instructor_daily_rate",
    "daily rate": "instructor_daily_rate",
    "materials cost": "materials_cost",
    "lab cost": "lab_cost",
    "learning path": "learning_path",
    "badge": "badge",
    "certification": "certification",
    "notes": "notes",
    "record source": "record_source",
    "instructor": "instructor",
    "instructors": "instructor",
    "assigned instructor": "instructor",
    "assigned instructors": "instructor",
}


def _normalize_enum(value, lookup: dict, default=None):
    if value is None:
        return default
    key = str(value).strip().lower()
    return lookup.get(key, default)


def map_row(row: dict) -> dict:
    """Map one spreadsheet row (header -> raw cell value) to CourseCreateRequest field names."""
    fields = {}
    for header, value in row.items():
        if header is None or value is None or str(value).strip() == "":
            continue
        clean_header = str(header).strip().lower()
        field = COLUMN_MAP_NORMALIZED.get(clean_header)
        if field is None:
            field = COLUMN_MAP.get(str(header).strip())
        if field is None:
            continue
        if field == "status":
            value = _normalize_enum(value, _STATUS_MAP, default="backlog")
        elif field == "ip_owner":
            value = _normalize_enum(value, _IP_OWNER_MAP, default=None)
        elif field == "lab_location":
            value = _normalize_enum(value, _LAB_LOCATION_MAP, default=None)
        elif field == "course_outline_status":
            value = _normalize_enum(value, _OUTLINE_STATUS_MAP, default=None)
        elif field == "skill_level":
            value = _normalize_enum(value, _SKILL_LEVEL_MAP, default=None)
        elif field == "on_ibm_pmt":
            value = str(value).strip()
        elif isinstance(value, str):
            value = value.replace("\xa0", " ").replace("\ufffd\t", "• ").replace("\ufffd", "-").strip()
        elif field in ("duration_days", "num_hours", "instructor_daily_rate", "materials_cost", "lab_cost"):
            if isinstance(value, str) and value.strip().startswith("="):
                value = None
            else:
                try:
                    clean_v = str(value).replace("$", "").replace(",", "").strip()
                    value = float(clean_v)
                except (ValueError, TypeError):
                    value = None
        elif field in ("ibm_retirement_date", "planned_completion_date", "release_date", "retire_date"):
            if hasattr(value, "date"):
                value = value.date()
            elif isinstance(value, str):
                try:
                    import datetime
                    value = datetime.date.fromisoformat(value.strip().split("T")[0])
                except Exception:
                    try:
                        from dateutil import parser
                        value = parser.parse(value.strip().split("T")[0]).date()
                    except Exception:
                        value = None

        if value is not None:
            fields[field] = value


    if "num_hours" not in fields and "duration_days" in fields and fields["duration_days"]:
        try:
            fields["num_hours"] = float(fields["duration_days"]) * 8
        except Exception:
            pass

    return fields


LESSON_COLUMN_MAP = {
    "course code": "course_code",
    "course_code": "course_code",
    "nfolks_course_code": "course_code",
    "course": "course_code",
    "lesson title": "title",
    "title": "title",
    "class name": "title",
    "class title": "title",
    "lesson name": "title",
    "lesson": "title",
    "sequence order": "sequence_order",
    "sequence": "sequence_order",
    "order": "sequence_order",
    "lesson number": "sequence_order",
    "lesson no": "sequence_order",
    "duration (minutes)": "duration_minutes",
    "duration (mins)": "duration_minutes",
    "duration minutes": "duration_minutes",
    "duration": "duration_minutes",
    "minutes": "duration_minutes",
    "attachment url": "attachment_url",
    "link": "attachment_url",
    "url": "attachment_url",
    "video link": "attachment_url",
    "resource link": "attachment_url",
    "content type": "attachment_content_type",
    "attachment_content_type": "attachment_content_type",
    "type": "attachment_content_type",
    "description": "description",
    "lesson description": "description",
    "article": "description",
    "article content": "description",
    "content": "description",
    "lesson notes": "description",
    "notes": "description",
    "video url": "attachment_url",
    "video link": "attachment_url",
    "lesson duration": "duration_minutes",
    "lesson duration (minutes)": "duration_minutes",
    "lesson duration (mins)": "duration_minutes",
    "lesson order": "sequence_order",
}


def map_lesson_row(row: dict) -> dict:
    """Map one spreadsheet row from Lessons/Classes sheet to Lesson fields."""
    fields = {}
    for header, value in row.items():
        if header is None or value is None or str(value).strip() == "":
            continue
        clean_header = str(header).strip().lower()
        field = LESSON_COLUMN_MAP.get(clean_header)
        if field is None:
            continue
        if field == "sequence_order":
            try:
                value = int(value)
            except (ValueError, TypeError):
                value = 1
        elif field == "duration_minutes":
            try:
                value = int(value)
            except (ValueError, TypeError):
                value = None
        fields[field] = value
    return fields

