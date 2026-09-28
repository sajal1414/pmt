import io
from fpdf import FPDF
from app.models import Course


class CourseOutlinePDF(FPDF):
    def header(self):
        self.set_fill_color(30, 58, 138)  # Deep Navy Blue
        self.rect(0, 0, 210, 14, "F")
        self.set_xy(10, 3)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "nFolks ATLAS | Course Outline & Syllabus Specification", 0, 0, "L")
        self.ln(15)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} | Confidential & Proprietary - nFolks Learning Services", 0, 0, "C")


def _sanitize(text: str | None) -> str:
    if not text:
        return ""
    # Replace non-latin-1 characters to avoid FPDF standard font encoding issues
    return (
        str(text)
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\xa0", " ")
        .encode("latin-1", "replace")
        .decode("latin-1")
    )


def generate_course_outline_pdf(course: Course) -> bytes:
    pdf = CourseOutlinePDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    code = _sanitize(course.nfolks_course_code or "ATLAS-COURSE")
    title = _sanitize(course.course_name or "Course Syllabus")

    # Title Banner
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(20, 30, 60)
    pdf.multi_cell(0, 8, title)
    pdf.ln(2)

    # Eyebrow / Code & Taxonomy
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(40, 6, f"Code: {code}")
    if course.ibm_course_codes:
        pdf.cell(50, 6, f"IBM Code: {_sanitize(course.ibm_course_codes)}")
    pdf.cell(50, 6, f"Status: {_sanitize(course.status.value.title())}")
    pdf.ln(7)

    # Metadata Grid Box
    pdf.set_fill_color(245, 247, 250)
    pdf.set_draw_color(210, 220, 235)
    pdf.rect(10, pdf.get_y(), 190, 28, "FD")
    y_start = pdf.get_y() + 2
    pdf.set_xy(12, y_start)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(70, 80, 95)
    pdf.cell(45, 5, "Platform:", 0, 0)
    pdf.cell(45, 5, "Product:", 0, 0)
    pdf.cell(45, 5, "Duration:", 0, 0)
    pdf.cell(45, 5, "Modality:", 0, 1)

    pdf.set_x(12)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(20, 20, 20)
    days = f"{course.duration_days} Days" if course.duration_days else "3 Days"
    hours = f" ({course.num_hours} Hours)" if course.num_hours else " (24 Hours)"
    pdf.cell(45, 6, _sanitize(course.platform or "Enterprise"), 0, 0)
    pdf.cell(45, 6, _sanitize(course.product or "Enterprise Platform"), 0, 0)
    pdf.cell(45, 6, days + hours, 0, 0)
    pdf.cell(45, 6, _sanitize(course.modality or "VILT"), 0, 1)

    pdf.set_x(12)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(70, 80, 95)
    pdf.cell(45, 5, "Skill Level:", 0, 0)
    pdf.cell(45, 5, "Lab Location:", 0, 0)
    pdf.cell(45, 5, "Max Students:", 0, 0)
    pdf.cell(45, 5, "Vendor / IP Owner:", 0, 1)

    pdf.set_x(12)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(45, 6, _sanitize((course.skill_level or "Intermediate").title()), 0, 0)
    pdf.cell(45, 6, _sanitize(course.lab_location.value if course.lab_location else "nFolks"), 0, 0)
    pdf.cell(45, 6, str(course.max_students or 16), 0, 0)
    vendor_ip = f"{course.vendor or 'IBM'} / {course.ip_owner.value if course.ip_owner else 'nFolks'}"
    pdf.cell(45, 6, _sanitize(vendor_ip), 0, 1)

    pdf.ln(5)

    # 1. Course Description
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 7, "1. Executive Summary & Course Description", 0, 1)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(40, 40, 40)
    desc = _sanitize(course.course_description or "Comprehensive hands-on technical curriculum designed for enterprise deployment.")
    pdf.multi_cell(0, 5, desc)
    pdf.ln(3)

    # 2. Audience & Pre-requisites
    if course.persona_audience_type or course.pre_reqs:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 58, 138)
        pdf.cell(0, 7, "2. Target Audience & Prerequisites", 0, 1)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(40, 40, 40)
        if course.persona_audience_type:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, "Target Persona:", 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, _sanitize(course.persona_audience_type))
            pdf.ln(1)
        if course.pre_reqs:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, "Prerequisites:", 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, _sanitize(course.pre_reqs))
            pdf.ln(1)
        pdf.ln(2)

    # 3. Lab Configuration & Technical Specs
    if course.lab_configuration or course.delivery_instruction_notes:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 58, 138)
        pdf.cell(0, 7, "3. Lab Environment & Delivery Notes", 0, 1)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(40, 40, 40)
        if course.lab_configuration:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, "Lab Configuration:", 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, _sanitize(course.lab_configuration))
            pdf.ln(1)
        if course.delivery_instruction_notes:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(0, 5, "Delivery Notes:", 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 5, _sanitize(course.delivery_instruction_notes))
            pdf.ln(1)
        pdf.ln(2)

    # 4. Curriculum & Lesson Breakdown Table
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 7, "4. Curriculum & Module Breakdown", 0, 1)

    lessons = course.lessons or []
    if lessons:
        # Table Header
        pdf.set_fill_color(30, 58, 138)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8.5)
        pdf.cell(12, 7, "Seq", 1, 0, "C", True)
        pdf.cell(115, 7, "Module Title / Scope", 1, 0, "L", True)
        pdf.cell(28, 7, "Timeline", 1, 0, "C", True)
        pdf.cell(35, 7, "Format", 1, 1, "C", True)

        pdf.set_text_color(30, 30, 30)
        pdf.set_font("Helvetica", "", 8.5)
        for idx, l in enumerate(sorted(lessons, key=lambda x: x.sequence_order or 0)):
            bg = idx % 2 == 1
            if bg:
                pdf.set_fill_color(248, 250, 252)
            else:
                pdf.set_fill_color(255, 255, 255)

            duration = f"{l.duration_minutes} mins" if l.duration_minutes else "30 mins"
            c_type = "Video Lecture" if (l.attachment_content_type == "video" or (l.attachment_url and "youtube" in l.attachment_url)) else "Hands-on Lab"
            
            pdf.cell(12, 6, str(l.sequence_order or idx + 1), 1, 0, "C", True)
            pdf.cell(115, 6, _sanitize(l.title)[:68], 1, 0, "L", True)
            pdf.cell(28, 6, duration, 1, 0, "C", True)
            pdf.cell(35, 6, c_type, 1, 1, "C", True)
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 6, "Standard modular curriculum scheduled per customer delivery.", 0, 1)

    return bytes(pdf.output())
