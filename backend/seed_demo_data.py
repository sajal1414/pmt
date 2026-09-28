"""Comprehensive seed script for Atlas demo.
Wipes existing courses and instructors, and populates full-fidelity demo data:
- Instructors with all fields filled
- Linked Instructor User accounts (ready to log in, must_change_password=False)
- Courses spanning AI, Cloud, Security, Integration, Data Lakehouse with all 36 fields filled
- Lessons with rich content: YouTube video embeds, HTML5 MP4 videos, PDF slide decks, in-depth Articles, and official links
- Deliveries & 5-star NPS Feedback from enterprise clients
"""

from datetime import date, datetime, timezone
from decimal import Decimal
import sys
import os

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.auth.auth_utils import hash_password
from app.models import (
    User,
    UserRole,
    Instructor,
    TravelPreference,
    Course,
    CourseStatus,
    CourseOutlineStatus,
    LabLocation,
    IPOwner,
    SkillLevel,
    Lesson,
    Delivery,
    DeliveryFeedback,
)


def seed():
    session = SessionLocal()
    try:
        print("1. Cleaning up existing data (Feedback, Deliveries, Lessons, Courses, Instructors)...")

        # Clean child tables first to avoid FK constraint issues
        session.query(DeliveryFeedback).delete()
        session.query(Delivery).delete()
        session.query(Lesson).delete()
        session.query(Course).delete()

        # Unlink any existing users from instructors before deleting instructors
        for u in session.query(User).filter(User.instructor_id.isnot(None)).all():
            u.instructor_id = None
        session.flush()

        # Delete existing instructors
        session.query(Instructor).delete()

        # Also remove any old instructor-role users so we can cleanly recreate them
        session.query(User).filter(User.role == UserRole.instructor).delete()
        session.commit()
        print("Existing courses and instructors cleared.")

        print("2. Seeding Instructors...")
        instructors_data = [
            {
                "name": "Dr. Sarah Jenkins",
                "email": "sarah.jenkins@nfolksdata.com",
                "location": "Austin, TX, USA",
                "travel_preference": TravelPreference.both,
                "languages": "English, German",
                "vendor": "IBM, AWS",
                "platform": "Data & AI",
                "portfolio": "Generative AI & Data Lakehouse",
                "product": "watsonx.ai, watsonx.data, Apache Iceberg",
                "skills_products": "watsonx.ai Studio, Foundation Models (Granite, LLaMA, Mistral), LangChain, RAG Pipelines, Vector DBs (Milvus, Chroma), Redshift, Apache Spark",
                "courses_can_teach": "ATLAS-AI-101, ATLAS-DATA-201, ATLAS-CLOUD-301",
                "feedback_score": Decimal("4.96"),
                "comments": "Principal AI Architect with 12+ years enterprise ML/AI delivery. Regular speaker at IBM Think, AI Summit, and active contributor to open-source RAG benchmarks.",
            },
            {
                "name": "Marcus Vance",
                "email": "marcus.vance@nfolksdata.com",
                "location": "London, UK",
                "travel_preference": TravelPreference.can_travel,
                "languages": "English, French",
                "vendor": "IBM, Red Hat",
                "platform": "Security",
                "portfolio": "Identity & Access Management, Threat Management",
                "product": "IBM Security Verify, QRadar SIEM, Guardium",
                "skills_products": "Identity Lifecycle, SAML 2.0 / OIDC Federation, Zero Trust Architecture, Privileged Access Management (PAM), SIEM Correlation Rules & SOAR Playbooks",
                "courses_can_teach": "ATLAS-SEC-101, ATLAS-SEC-202, ATLAS-OPS-401",
                "feedback_score": Decimal("4.92"),
                "comments": "Former banking CISO advisor and certified IBM Security Master Instructor. Specializes in multi-tenant identity governance and defense-in-depth compliance.",
            },
            {
                "name": "Elena Rostova",
                "email": "elena.rostova@nfolksdata.com",
                "location": "Berlin, Germany",
                "travel_preference": TravelPreference.virtual_only,
                "languages": "English, German, Russian",
                "vendor": "Red Hat, IBM",
                "platform": "Cloud",
                "portfolio": "Cloud-Native Infrastructure & Containers",
                "product": "OpenShift Container Platform, Kubernetes, RHEL",
                "skills_products": "OpenShift 4.16, Kubernetes Operator Framework, Service Mesh (Istio), GitOps (ArgoCD), OVN Networking, Hybrid Cloud Disaster Recovery",
                "courses_can_teach": "ATLAS-OPS-101, ATLAS-OPS-202, ATLAS-CLOUD-301",
                "feedback_score": Decimal("4.89"),
                "comments": "Red Hat Certified Architect (RHCA Level VIII). Lead instructor for European financial services container migrations and mission-critical Kubernetes operations.",
            },
            {
                "name": "Vikram Anand",
                "email": "vikram.anand@nfolksdata.com",
                "location": "Bengaluru, India",
                "travel_preference": TravelPreference.both,
                "languages": "English, Hindi, Marathi",
                "vendor": "IBM",
                "platform": "Automation",
                "portfolio": "Hybrid Integration & Messaging",
                "product": "App Connect Enterprise, IBM MQ, API Connect",
                "skills_products": "App Connect Enterprise v12, IBM MQ 9.3 High Availability, Event Streams (Kafka), RESTful API Design, Microservices Gateway Architecture",
                "courses_can_teach": "ATLAS-INT-101, ATLAS-INT-202",
                "feedback_score": Decimal("4.94"),
                "comments": "15+ years experience in enterprise middleware and high-throughput financial payment gateway transaction pipelines.",
            },
        ]

        instructors_by_email = {}
        for data in instructors_data:
            inst = Instructor(**data)
            session.add(inst)
            session.flush()
            instructors_by_email[inst.email] = inst
            print(f"  Created Instructor: {inst.name} ({inst.email}) [ID: {inst.id}]")

        print("3. Seeding Instructor User Accounts (ready to log in with password: 'Instructor123!')...")
        for email, inst in instructors_by_email.items():
            user = User(
                email=email,
                password_hash=hash_password("Instructor123!"),
                role=UserRole.instructor,
                full_name=inst.name,
                instructor_id=inst.id,
                must_change_password=False,
            )
            session.add(user)
            print(f"  Created User Account: {user.email} -> Instructor #{inst.id}")
        session.flush()

        # Ensure admin user has Admin123! and must_change_password=False for seamless demo
        admin_user = session.query(User).filter(User.email == "admin@nfolks.com").first()
        if admin_user:
            admin_user.password_hash = hash_password("Admin123!")
            admin_user.must_change_password = False
            session.flush()
        else:
            admin_user = User(
                email="admin@nfolks.com",
                password_hash=hash_password("Admin123!"),
                role=UserRole.admin,
                full_name="nFolks Admin",
                must_change_password=False,
            )
            session.add(admin_user)
            session.flush()

        print("4. Seeding Courses...")
        courses_data = [
            {
                "vendor": "IBM",
                "platform": "Data & AI",
                "portfolio": "Generative AI",
                "product": "watsonx.ai",
                "nfolks_course_code": "ATLAS-AI-101",
                "ibm_course_codes": "WX101G",
                "status": CourseStatus.published,
                "course_name": "IBM watsonx.ai: Foundation Models, RAG Architecture & Enterprise GenAI",
                "course_outline_status": CourseOutlineStatus.validated,
                "modality": "VILT",
                "duration_days": Decimal("3.0"),
                "num_hours": Decimal("24.0"),
                "on_ibm_pmt": "Yes",
                "lab_location": LabLocation.itz,
                "ibm_retirement_date": date(2028, 12, 31),
                "ip_owner": IPOwner.nfolks,
                "course_author_email": "sarah.jenkins@nfolksdata.com",
                "planned_completion_date": date(2025, 1, 15),
                "release_date": date(2025, 2, 1),
                "retire_date": date(2028, 12, 31),
                "course_description": (
                    "Master enterprise Generative AI workflows with IBM watsonx.ai Studio. "
                    "Learn prompt engineering patterns, foundation model selection (Granite, LLaMA, Mistral), "
                    "vector embeddings with Chroma & Milvus, LangChain integration, and end-to-end "
                    "Retrieval-Augmented Generation (RAG) pipelines with governance and hallucination detection."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.advanced,
                "max_students": 18,
                "pre_reqs": "Proficiency in Python 3.10+, solid grasp of REST APIs, and basic familiarity with linear algebra and transformer neural networks.",
                "persona_audience_type": "AI Engineers, Machine Learning Practitioners, Enterprise Solutions Architects, Full-Stack Developers",
                "lab_configuration": "Dedicated IBM Technology Zone (ITZ) sandbox with GPU-accelerated JupyterLab instances, watsonx API entitlement, and Milvus vector database.",
                "course_technical_requirements": "Modern browser (Chrome/Firefox/Edge), 8GB RAM minimum, high-speed internet connection, access to port 443 for ITZ lab gateway.",
                "delivery_instruction_notes": "Provision student credentials 48 hours in advance. Keep backup API keys available in case of rate limits during lab exercises 3 and 5.",
                "instructor_daily_rate": Decimal("1500.00"),
                "materials_cost": Decimal("120.00"),
                "lab_cost": Decimal("280.00"),
                "learning_path": "Enterprise AI Specialist Track",
                "badge": "IBM watsonx.ai Solutions Architect",
                "certification": "C1000-168: IBM watsonx Specialist",
                "notes": "Flagship generative AI offering. Featured in enterprise quarterly partner training series.",
                "record_source": "Curriculum Engineering Q1",
            },
            {
                "vendor": "IBM",
                "platform": "Security",
                "portfolio": "Identity & Access Management",
                "product": "Security Verify",
                "nfolks_course_code": "ATLAS-SEC-101",
                "ibm_course_codes": "TX315G",
                "status": CourseStatus.published,
                "course_name": "IBM Security Verify: Zero Trust Identity, SSO Federation & Access Governance",
                "course_outline_status": CourseOutlineStatus.validated,
                "modality": "ILT",
                "duration_days": Decimal("3.0"),
                "num_hours": Decimal("24.0"),
                "on_ibm_pmt": "Yes",
                "lab_location": LabLocation.itz,
                "ibm_retirement_date": date(2027, 12, 31),
                "ip_owner": IPOwner.nfolks,
                "course_author_email": "marcus.vance@nfolksdata.com",
                "planned_completion_date": date(2024, 11, 10),
                "release_date": date(2024, 12, 1),
                "retire_date": date(2027, 12, 31),
                "course_description": (
                    "In-depth practical training on enterprise identity lifecycle and modern authentication with IBM Security Verify. "
                    "Topics include SAML 2.0 and OIDC identity federation, adaptive multi-factor authentication (MFA), passwordless FIDO2 "
                    "authentication, conditional access rules, and automated SCIM provisioning."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.intermediate,
                "max_students": 20,
                "pre_reqs": "Foundational knowledge of TCP/IP networking, DNS, directory services (LDAP/Active Directory), and web authentication protocols.",
                "persona_audience_type": "Identity Architects, Security Engineers, IAM Administrators, DevOps Security Leads",
                "lab_configuration": "Dedicated IBM Security Verify tenant per student with Azure AD federated test directory and sample SaaS applications.",
                "course_technical_requirements": "Browser with cookies and popups enabled, mobile device capable of installing IBM Verify Authenticator app for MFA exercises.",
                "delivery_instruction_notes": "Verify that students have received their individual tenant invitation emails prior to starting Module 2.",
                "instructor_daily_rate": Decimal("1350.00"),
                "materials_cost": Decimal("85.00"),
                "lab_cost": Decimal("190.00"),
                "learning_path": "Zero Trust Security Architect Track",
                "badge": "IBM Security Verify Professional",
                "certification": "C1000-142: IBM Security Verify Administrator",
                "notes": "Consistently achieves 4.9+ NPS ratings in client deliveries.",
                "record_source": "Curriculum Engineering Q1",
            },
            {
                "vendor": "Red Hat",
                "platform": "Cloud",
                "portfolio": "Cloud-Native Infrastructure",
                "product": "OpenShift Container Platform",
                "nfolks_course_code": "ATLAS-OPS-101",
                "ibm_course_codes": "DO280",
                "status": CourseStatus.published,
                "course_name": "Red Hat OpenShift Administration II: Operating a Production Cluster",
                "course_outline_status": CourseOutlineStatus.validated,
                "modality": "Blended",
                "duration_days": Decimal("4.0"),
                "num_hours": Decimal("32.0"),
                "on_ibm_pmt": "No",
                "lab_location": LabLocation.instructor_owned,
                "ibm_retirement_date": date(2027, 9, 30),
                "ip_owner": IPOwner.nfolks,
                "course_author_email": "elena.rostova@nfolksdata.com",
                "planned_completion_date": date(2024, 10, 15),
                "release_date": date(2024, 11, 1),
                "retire_date": date(2027, 9, 30),
                "course_description": (
                    "Configuring, troubleshooting, and managing Red Hat OpenShift Container Platform clusters in demanding production environments. "
                    "Covers day-2 operations, multi-tenancy, cluster security policies, SDN/OVN-Kubernetes networking, monitoring with Prometheus/Grafana, "
                    "and backup with OADP."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.intermediate,
                "max_students": 16,
                "pre_reqs": "Red Hat Certified System Administrator (RHCSA) certification or equivalent Linux sysadmin experience; basic Docker/Kubernetes container knowledge.",
                "persona_audience_type": "Site Reliability Engineers, Kubernetes Cluster Operators, Cloud Systems Administrators",
                "lab_configuration": "Dedicated 3-master, 3-worker OpenShift 4.16 cluster per attendee with bastion SSH gateway and persistent storage.",
                "course_technical_requirements": "SSH client (OpenSSH/PuTTY), dual monitor setup recommended for live cluster administration exercises.",
                "delivery_instruction_notes": "Verify wildcard DNS routing (*.apps.cluster.domain) is operational across all student clusters on setup day.",
                "instructor_daily_rate": Decimal("1400.00"),
                "materials_cost": Decimal("95.00"),
                "lab_cost": Decimal("320.00"),
                "learning_path": "Red Hat Certified Specialist in OpenShift",
                "badge": "Red Hat Certified OpenShift Administrator",
                "certification": "EX280: Red Hat Certified Specialist in OpenShift Administration",
                "notes": "Core curriculum course for cloud-native modernization initiatives.",
                "record_source": "Curriculum Engineering Q1",
            },
            {
                "vendor": "IBM",
                "platform": "Automation",
                "portfolio": "Hybrid Integration",
                "product": "App Connect Enterprise",
                "nfolks_course_code": "ATLAS-INT-101",
                "ibm_course_codes": "WM668G",
                "status": CourseStatus.in_progress,
                "course_name": "IBM App Connect Enterprise v12: High-Performance Integration & API Workflows",
                "course_outline_status": CourseOutlineStatus.draft,
                "modality": "VILT",
                "duration_days": Decimal("3.0"),
                "num_hours": Decimal("24.0"),
                "on_ibm_pmt": "Yes",
                "lab_location": LabLocation.itz,
                "ibm_retirement_date": date(2026, 12, 31),
                "ip_owner": IPOwner.subk,
                "course_author_email": "vikram.anand@nfolksdata.com",
                "planned_completion_date": date(2025, 3, 30),
                "release_date": date(2025, 4, 15),
                "retire_date": date(2026, 12, 31),
                "course_description": (
                    "Design, develop, test, and deploy enterprise integration flows and RESTful services using IBM App Connect Enterprise (ACE) v12 "
                    "and IBM MQ. Learn transformation techniques with ESQL, Java, and graphical data maps, containerized ACE deployments on OpenShift, "
                    "and automated unit testing frameworks."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.foundational,
                "max_students": 22,
                "pre_reqs": "General programming principles, XML and JSON data formats, and understanding of enterprise messaging concepts.",
                "persona_audience_type": "Integration Developers, SOA Middleware Specialists, API Developers",
                "lab_configuration": "Virtual Windows development workstation with ACE Toolkit v12, IBM MQ 9.3 local queue manager, and Postman API workspace.",
                "course_technical_requirements": "RDP client to access cloud-hosted development desktop.",
                "delivery_instruction_notes": "Ensure local MQ queue managers QM1 and QM2 are started and listeners active before lab module 3.",
                "instructor_daily_rate": Decimal("1150.00"),
                "materials_cost": Decimal("65.00"),
                "lab_cost": Decimal("175.00"),
                "learning_path": "Enterprise Integration Specialist",
                "badge": "IBM App Connect Enterprise Developer",
                "certification": "C1000-117: IBM App Connect Enterprise v12 Solution Developer",
                "notes": "Updated for ACE v12 fixpack 8 with containerized server deployment.",
                "record_source": "Curriculum Engineering Q1",
            },
            {
                "vendor": "IBM",
                "platform": "Data & AI",
                "portfolio": "Data Lakehouse",
                "product": "watsonx.data",
                "nfolks_course_code": "ATLAS-DATA-201",
                "ibm_course_codes": "WX201G",
                "status": CourseStatus.for_review,
                "course_name": "IBM watsonx.data & Apache Iceberg: Modern Open Lakehouse Architecture",
                "course_outline_status": CourseOutlineStatus.partially_complete,
                "modality": "VILT",
                "duration_days": Decimal("2.0"),
                "num_hours": Decimal("16.0"),
                "on_ibm_pmt": "Yes",
                "lab_location": LabLocation.nfolks,
                "ibm_retirement_date": date(2028, 6, 30),
                "ip_owner": IPOwner.nfolks,
                "course_author_email": "sarah.jenkins@nfolksdata.com",
                "planned_completion_date": date(2025, 5, 15),
                "release_date": date(2025, 6, 1),
                "retire_date": date(2028, 6, 30),
                "course_description": (
                    "Architect and scale high-performance open data lakehouses with IBM watsonx.data, Presto query engine, and Apache Iceberg table format. "
                    "Topics include storage optimization, zero-copy data virtualization across S3 and Db2, metadata caching, and fine-grained access control with Apache Ranger."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.advanced,
                "max_students": 18,
                "pre_reqs": "Strong SQL query optimization skills, understanding of distributed storage, and data warehouse concepts.",
                "persona_audience_type": "Data Engineers, Lakehouse Architects, BI Platform Leads",
                "lab_configuration": "Multi-node Presto cluster connected to MinIO object storage with pre-ingested 50GB TPC-DS benchmarking dataset.",
                "course_technical_requirements": "DBeaver or similar database query tool capable of Presto / Trino JDBC connections.",
                "delivery_instruction_notes": "Check that Apache Ranger policy sync is running with under 10-second latency.",
                "instructor_daily_rate": Decimal("1450.00"),
                "materials_cost": Decimal("90.00"),
                "lab_cost": Decimal("240.00"),
                "learning_path": "Modern Data Lakehouse Architect",
                "badge": "watsonx.data Lakehouse Specialist",
                "certification": "C1000-172: IBM watsonx.data Technical Professional",
                "notes": "Designed in partnership with IBM Data & AI ecosystem team.",
                "record_source": "Curriculum Engineering Q1",
            },
            {
                "vendor": "Red Hat",
                "platform": "Security",
                "portfolio": "DevSecOps",
                "product": "Red Hat Advanced Cluster Security (ACS)",
                "nfolks_course_code": "ATLAS-SEC-202",
                "ibm_course_codes": "CSO202G",
                "status": CourseStatus.pipeline,
                "course_name": "Cloud-Native DevSecOps: Security Automation & Pipeline Compliance",
                "course_outline_status": CourseOutlineStatus.not_yet_scoped,
                "modality": "Self-Paced",
                "duration_days": Decimal("2.0"),
                "num_hours": Decimal("16.0"),
                "on_ibm_pmt": "No",
                "lab_location": LabLocation.na,
                "ibm_retirement_date": None,
                "ip_owner": IPOwner.nfolks,
                "course_author_email": "marcus.vance@nfolksdata.com",
                "planned_completion_date": date(2025, 7, 1),
                "release_date": date(2025, 8, 1),
                "retire_date": date(2028, 12, 31),
                "course_description": (
                    "Comprehensive methodology for shifting security left in containerized development pipelines. "
                    "Integrate vulnerability scanning, Kubernetes admission control policies, software bill of materials (SBOM) "
                    "verification, and runtime threat detection using StackRox / Red Hat ACS."
                ),
                "link_to_course_outline": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "skill_level": SkillLevel.foundational,
                "max_students": 30,
                "pre_reqs": "Basic Git workflow, familiarity with Dockerfiles, and standard CI/CD pipeline concepts.",
                "persona_audience_type": "DevOps Engineers, Security Analysts, Cloud Security Architects",
                "lab_configuration": "GitLab CI runner paired with Kubernetes cluster running ACS Central.",
                "course_technical_requirements": "Standard web browser with terminal support.",
                "delivery_instruction_notes": "Self-paced asynchronous lab access.",
                "instructor_daily_rate": Decimal("1000.00"),
                "materials_cost": Decimal("50.00"),
                "lab_cost": Decimal("100.00"),
                "learning_path": "Cloud Security Practitioner",
                "badge": "nFolks Certified DevSecOps Specialist",
                "certification": "CSO-202",
                "notes": "High interest from enterprise compliance teams.",
                "record_source": "Curriculum Engineering Q1",
            },
        ]

        courses_by_code = {}
        for cdata in courses_data:
            c = Course(**cdata)
            session.add(c)
            session.flush()
            courses_by_code[c.nfolks_course_code] = c
            print(f"  Created Course: {c.nfolks_course_code} - {c.course_name} [ID: {c.id}]")

        print("5. Seeding Lessons with all formats (Videos, YouTube, PDFs, Articles, Links)...")

        # Course 1: watsonx.ai lessons (demonstrating all 5 media types!)
        c1 = courses_by_code["ATLAS-AI-101"]
        c1_lessons = [
            Lesson(
                course_id=c1.id,
                title="1. Introduction to Foundation Models & watsonx.ai Architecture",
                sequence_order=1,
                duration_minutes=25,
                attachment_url="https://www.youtube.com/watch?v=kCc8FmEb1nY",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="An executive and technical overview of IBM watsonx.ai architecture, the Granite family of models, and the enterprise AI lifecycle.",
            ),
            Lesson(
                course_id=c1.id,
                title="2. Enterprise Generative AI Patterns & Prompt Engineering Guide",
                sequence_order=2,
                duration_minutes=40,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### Enterprise Prompt Engineering: Principles & Best Practices

Generative AI prompt design in enterprise environments requires deterministic, verifiable outputs. Unlike casual conversational interfaces, automated workflows demand structured responses, token discipline, and defense against prompt injection.

#### Core Prompt Components
1. **System Directive**: Defines model role, operational bounds, and persona.
2. **Context Window Injection**: Grounding facts extracted from authoritative corporate data sources.
3. **Task Instruction**: Exact transformation, analysis, or structured reasoning required.
4. **Output Schema**: Pydantic / JSON schema constraints to ensure downstream system interoperability.

#### Few-Shot Demonstration Technique
When guiding models on complex domain reasoning, include 2-3 input-output exemplar pairs within the prompt template:
- *Input Example 1*: "Invoice 9021 from Vendor Acronis for $4,500 due 30 days net." -> `{"vendor": "Acronis", "amount": 4500, "term": 30}`
- *Input Example 2*: "Bill #7712 from Fastly CDN: total $1,250 on net 15." -> `{"vendor": "Fastly CDN", "amount": 1250, "term": 15}`

#### Guardrails & Hallucination Mitigation
Always instruct the model:
> *"If the supplied context does not contain sufficient facts to answer the query, respond with 'INFORMATION_NOT_FOUND' and do not extrapolate or hallucinate."*

#### Temperature & Decoding Strategies
- **Factual Extraction**: Temperature `0.0 - 0.2`, Top-P `0.9`
- **Creative / Drafting**: Temperature `0.7 - 0.9`, Top-P `0.95`
- **Strict Classification**: Temperature `0.0`, Greedy decoding""",
            ),
            Lesson(
                course_id=c1.id,
                title="3. Deep Learning: Neural Networks, Embeddings & Vector Search",
                sequence_order=3,
                duration_minutes=35,
                attachment_url="https://www.youtube.com/watch?v=aircAruvnKk",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Comprehensive visual walkthrough of neural network representations, dense vector embeddings, and high-dimensional similarity search for enterprise RAG pipelines.",
            ),
            Lesson(
                course_id=c1.id,
                title="4. watsonx.ai Enterprise Reference Architecture Blueprint",
                sequence_order=4,
                duration_minutes=45,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Comprehensive reference PDF detailing VPC network isolation, private endpoints, key management (HSM), and compliance controls for watsonx SaaS and on-prem deployments.",
            ),
            Lesson(
                course_id=c1.id,
                title="5. Official SDK & LangChain Integration Documentation",
                sequence_order=5,
                duration_minutes=20,
                attachment_url="https://ibm.github.io/watsonx-ai-python-sdk/",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Direct link to the official IBM watsonx-ai-python-sdk repository and developer API reference guide.",
            ),
        ]
        session.add_all(c1_lessons)
        print(f"  Added 5 lessons to {c1.nfolks_course_code} (YouTube, Article, MP4 Video, PDF, External Link)")

        # Course 2: Security Verify lessons
        c2 = courses_by_code["ATLAS-SEC-101"]
        c2_lessons = [
            Lesson(
                course_id=c2.id,
                title="1. Zero Trust Architecture & Identity Principles",
                sequence_order=1,
                duration_minutes=30,
                attachment_url="https://www.youtube.com/watch?v=aircAruvnKk",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Introduction to Zero Trust Security posture: Verify explicitly, Use least privilege access, and Assume breach.",
            ),
            Lesson(
                course_id=c2.id,
                title="2. SAML 2.0 & OIDC Federation Architecture Specification",
                sequence_order=2,
                duration_minutes=45,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### Modern Identity Federation: SAML 2.0 vs OIDC Deep Dive

Enterprise Identity and Access Management (IAM) standardizes around two open protocols: **SAML 2.0** for legacy web SSO and **OpenID Connect (OIDC)** for modern web and mobile apps.

#### SAML 2.0 Flow
1. **User attempts to access SP** (Service Provider / application).
2. **SP issues SAML AuthnRequest** (signed XML) and redirects user's browser to IdP.
3. **IdP authenticates user** (via credentials, MFA, or cert).
4. **IdP issues signed SAML Response** containing SAML Assertion with attributes (email, groups, tenant ID).
5. **SP validates signature and establishes session cookie**.

#### OpenID Connect (OIDC) & PKCE
Built on OAuth 2.0, OIDC introduces the **ID Token** (JSON Web Token - JWT) alongside Access Tokens.
- For Single-Page Apps (SPA) and mobile: ALWAYS mandate **Authorization Code Flow with Proof Key for Code Exchange (PKCE)**.
- Prevents authorization code interception attacks without requiring a client secret on insecure endpoints.""",
            ),
            Lesson(
                course_id=c2.id,
                title="3. IBM Security Verify Implementation & Runbook Guide",
                sequence_order=3,
                duration_minutes=50,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Complete PDF guide covering tenant provisioning, certificate lifecycle, custom branding, and SCIM directory synchronization.",
            ),
            Lesson(
                course_id=c2.id,
                title="4. Hands-on Lab: Configuring Adaptive Access Policies",
                sequence_order=4,
                duration_minutes=30,
                attachment_url="https://vjs.zencdn.net/v/oceans.mp4",
                attachment_s3_key=None,
                attachment_content_type="video/mp4",
                description="Video tutorial showing step-by-step creation of geo-velocity risk rules and step-up MFA triggers in IBM Security Verify admin console.",
            ),
        ]
        session.add_all(c2_lessons)
        print(f"  Added 4 lessons to {c2.nfolks_course_code} (YouTube, Article, PDF, MP4 Video)")

        # Course 3: OpenShift lessons
        c3 = courses_by_code["ATLAS-OPS-101"]
        c3_lessons = [
            Lesson(
                course_id=c3.id,
                title="1. OpenShift 4.16 Core Architecture & Control Plane Components",
                sequence_order=1,
                duration_minutes=35,
                attachment_url="https://www.youtube.com/watch?v=X48VuDVv0do",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Comprehensive breakdown of OpenShift control plane, CoreOS immutable host OS, and cluster operators.",
            ),
            Lesson(
                course_id=c3.id,
                title="2. Production Multi-Tenancy & Network Isolation Runbook",
                sequence_order=2,
                duration_minutes=40,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### OpenShift Multi-Tenancy Architecture Guide

Running multiple enterprise workloads on shared OpenShift clusters requires rigorous multi-dimensional isolation.

#### 1. Namespace & Project Boundaries
Every OpenShift Project is a Kubernetes Namespace with additional RBAC annotations.
- Isolate environments: `app-dev`, `app-stage`, `app-prod`.
- Limit default privileges: Restrict `system:authenticated` users from viewing project resources outside their authorized group.

#### 2. Network Policies (OVN-Kubernetes)
By default, all pods across all projects can communicate. Secure your tenants with strict default-deny policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

#### 3. Compute Resource Quotas & LimitRanges
Guarantee fair resource distribution and prevent rogue pods from consuming worker nodes:
- Set `requests.cpu` and `limits.cpu`
- Enforce Memory Limits with automatic OOM safeguards""",
            ),
            Lesson(
                course_id=c3.id,
                title="3. OpenShift Cluster Operations & Disaster Recovery Manual",
                sequence_order=3,
                duration_minutes=45,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Step-by-step operational manual for etcd backup & restore, node drainage, and zero-downtime cluster upgrades.",
            ),
        ]
        session.add_all(c3_lessons)
        print(f"  Added 3 lessons to {c3.nfolks_course_code} (YouTube, Article, PDF)")

        # Course 4: App Connect lessons
        c4 = courses_by_code["ATLAS-INT-101"]
        c4_lessons = [
            Lesson(
                course_id=c4.id,
                title="1. ACE v12 Architecture & Message Flow Foundations",
                sequence_order=1,
                duration_minutes=35,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### App Connect Enterprise v12: Message Flow Concepts

IBM App Connect Enterprise (ACE) v12 delivers modern lightweight integration servers capable of running on bare-metal, VMs, or containerized within Kubernetes/OpenShift.

#### Key Architectural Entities
- **Integration Node (Broker)**: Central management daemon managing one or more Integration Servers.
- **Integration Server**: Independent execution process running deployed message flows.
- **BAR File (Broker Archive)**: Deployment unit encapsulating compiled message flows, message sets, Java jars, and ESQL files.

#### ESQL Transform Nodes
The Compute node utilizes Extended SQL (ESQL) to construct output trees from incoming input trees:
```sql
CREATE COMPUTE MODULE TransformOrder_Compute
    CREATE FUNCTION Main() RETURNS BOOLEAN
    BEGIN
        SET OutputRoot = InputRoot;
        SET OutputRoot.JSON.Data.orderId = InputRoot.XMLNSC.Order.Header.ID;
        SET OutputRoot.JSON.Data.processedAt = CURRENT_TIMESTAMP;
        RETURN TRUE;
    END;
END MODULE;
```""",
            ),
            Lesson(
                course_id=c4.id,
                title="2. IBM MQ 9.3 High Availability Architecture Reference",
                sequence_order=2,
                duration_minutes=45,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Architecture diagram and configuration guide for Native HA multi-instance queue managers.",
            ),
        ]
        session.add_all(c4_lessons)
        print(f"  Added 2 lessons to {c4.nfolks_course_code} (Article, PDF)")

        # Course 5: watsonx.data Lakehouse lessons
        c5 = courses_by_code["ATLAS-DATA-201"]
        c5_lessons = [
            Lesson(
                course_id=c5.id,
                title="1. Open Data Lakehouse Foundations & Storage Tier",
                sequence_order=1,
                duration_minutes=35,
                attachment_url="https://www.youtube.com/watch?v=X48VuDVv0do",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Overview of modern open lakehouse architectures combining Apache Iceberg, S3-compatible object storage, and decoupled query engines.",
            ),
            Lesson(
                course_id=c5.id,
                title="2. Apache Iceberg Metadata Architecture & ACID Isolation",
                sequence_order=2,
                duration_minutes=45,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### Apache Iceberg: Metadata Architecture & ACID Transactions

Apache Iceberg provides a high-performance open table format for huge analytic datasets, enabling full ACID guarantees on top of cloud object storage.

#### 1. The Iceberg Metadata Hierarchy
Iceberg abstracts datasets through a three-layer metadata tree:
- **Iceberg Catalog**: Points to the current Metadata Pointer for the table (e.g. Hive Metastore, AWS Glue, or Nessie).
- **Metadata File (`vN.metadata.json`)**: Contains schema definitions, partition specs, and snapshots log.
- **Manifest List**: Defines the data files and partition boundaries associated with a single snapshot.
- **Manifest File**: Contains exact file paths, metrics (min/max bounds per column), and row counts.

#### 2. Hidden Partitioning
Unlike traditional Hive tables where directory structures dictate partitioning (`/year=2026/month=03/`), Iceberg handles partitioning transparently:
- Partition transforms: `years(ts)`, `months(ts)`, `days(ts)`, `bucket(16, id)`.
- Eliminates query partition mistakes and enables non-disruptive partition evolution.

#### 3. Time Travel & Rollback
Query past states without duplicate storage using snapshot IDs:
```sql
SELECT count(*) FROM telemetry_lakehouse.audit_logs
FOR SYSTEM_TIME AS OF '2026-03-01 00:00:00.000 UTC';
```""",
            ),
            Lesson(
                course_id=c5.id,
                title="3. watsonx.data Query Optimization & Apache Ranger Security Guide",
                sequence_order=3,
                duration_minutes=40,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Reference manual covering Presto query engine cost-based optimizer, Iceberg compaction maintenance, and fine-grained column masking via Apache Ranger.",
            ),
        ]
        session.add_all(c5_lessons)
        print(f"  Added 3 lessons to {c5.nfolks_course_code} (YouTube, Article, PDF)")

        # Course 6: DevSecOps Pipeline lessons
        c6 = courses_by_code["ATLAS-SEC-202"]
        c6_lessons = [
            Lesson(
                course_id=c6.id,
                title="1. DevSecOps Architecture & Shift-Left Security Principles",
                sequence_order=1,
                duration_minutes=30,
                attachment_url="https://www.youtube.com/watch?v=aircAruvnKk",
                attachment_s3_key=None,
                attachment_content_type=None,
                description="Fundamentals of embedding automated security checks, static code analysis (SAST), and dependency auditing into CI/CD build gates.",
            ),
            Lesson(
                course_id=c6.id,
                title="2. Container Image Vulnerability Scanning & Admission Gateways",
                sequence_order=2,
                duration_minutes=40,
                attachment_url=None,
                attachment_s3_key=None,
                attachment_content_type=None,
                description="""### Automated Container Security & Policy Gateways

Implementing zero-trust supply chain security requires validating container image integrity before deployment to production Kubernetes clusters.

#### 1. Shift-Left CI Image Scanning
Integrate container vulnerability scanning directly into the build pipeline:
- Scan for CVEs with CVSS >= 7.0 and fail builds automatically.
- Generate Software Bill of Materials (SBOM) in SPDX and CycloneDX formats.

#### 2. Cryptographic Image Signing with Sigstore Cosign
Sign build artifacts using Ephemeral OIDC credentials:
```bash
cosign sign --yes \
  --key env://COSIGN_PRIVATE_KEY \
  ghcr.io/nfolks/secure-worker:v2.4.1
```

#### 3. Kubernetes Admission Enforcement with Kyverno
Enforce that only verified, signed images run on the cluster:
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: check-image-signatures
spec:
  validationFailureAction: Enforce
  rules:
  - name: verify-signature
    match:
      resources:
        kinds: [Pod]
    verifyImages:
    - imageReferences: ["ghcr.io/nfolks/*"]
      attestors:
      - entries:
        - keys:
            publicKeys: |
              -----BEGIN PUBLIC KEY-----
              MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
              -----END PUBLIC KEY-----
```""",
            ),
            Lesson(
                course_id=c6.id,
                title="3. Kubernetes Compliance Automation & CIS Benchmark Runbook",
                sequence_order=3,
                duration_minutes=45,
                attachment_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                attachment_s3_key=None,
                attachment_content_type="application/pdf",
                description="Audit checklists, hardening scripts, and automated compliance policies aligning OpenShift and Kubernetes with CIS Benchmarks v1.8.",
            ),
        ]
        session.add_all(c6_lessons)
        print(f"  Added 3 lessons to {c6.nfolks_course_code} (YouTube, Article, PDF)")
        session.flush()

        print("6. Seeding Deliveries & NPS Client Feedback...")
        deliveries_data = [
            {
                "student_name": "David Chen",
                "student_email": "david.chen@jpmorgan.com",
                "student_demographics": "US East - Financial Technology",
                "company": "JPMorgan Chase & Co.",
                "company_industry": "Financial Services",
                "role": "Principal Cloud AI Architect",
                "location": "New York, NY",
                "modality": "VILT",
                "course_name": c1.course_name,
                "course_id": c1.id,
                "instructor_id": instructors_by_email["sarah.jenkins@nfolksdata.com"].id,
                "delivery_date": date(2025, 2, 10),
                "feedback": {
                    "course_name": c1.course_name,
                    "course_code": c1.nfolks_course_code,
                    "nps_score": 10,
                    "feedback_text": (
                        "Exceptional training! Sarah's depth in foundation models and RAG pipelines helped our architecture "
                        "team solve a critical vector indexing roadblock in production. The lab environments were flawless."
                    ),
                },
            },
            {
                "student_name": "Emily Watson",
                "student_email": "e.watson@boeing.com",
                "student_demographics": "US West - Aerospace Systems",
                "company": "The Boeing Company",
                "company_industry": "Aerospace & Defense",
                "role": "Enterprise IAM Security Lead",
                "location": "Seattle, WA",
                "modality": "ILT",
                "course_name": c2.course_name,
                "course_id": c2.id,
                "instructor_id": instructors_by_email["marcus.vance@nfolksdata.com"].id,
                "delivery_date": date(2025, 1, 22),
                "feedback": {
                    "course_name": c2.course_name,
                    "course_code": c2.nfolks_course_code,
                    "nps_score": 10,
                    "feedback_text": (
                        "Marcus is a true subject matter authority. Hands down the best identity and access management course "
                        "our team has attended. The SAML and OIDC federation troubleshooting scenarios saved us weeks of trial and error."
                    ),
                },
            },
            {
                "student_name": "Alexander Schultz",
                "student_email": "a.schultz@siemens.de",
                "student_demographics": "EU Central - Industrial Automation",
                "company": "Siemens AG",
                "company_industry": "Industrial Engineering",
                "role": "Lead Site Reliability Engineer",
                "location": "Munich, Germany",
                "modality": "Blended",
                "course_name": c3.course_name,
                "course_id": c3.id,
                "instructor_id": instructors_by_email["elena.rostova@nfolksdata.com"].id,
                "delivery_date": date(2024, 12, 15),
                "feedback": {
                    "course_name": c3.course_name,
                    "course_code": c3.nfolks_course_code,
                    "nps_score": 9,
                    "feedback_text": (
                        "Elena's hands-on approach to OpenShift cluster recovery and OVN networking was brilliant. "
                        "Her real-world experience as an RHCA clearly shined through."
                    ),
                },
            },
            {
                "student_name": "Priya Sharma",
                "student_email": "priya.s@deloitte.com",
                "student_demographics": "APAC - Cloud & Systems Engineering",
                "company": "Deloitte Consulting",
                "company_industry": "Professional Services",
                "role": "Senior Solutions Architect",
                "location": "Bengaluru, India",
                "modality": "VILT",
                "course_name": c4.course_name,
                "course_id": c4.id,
                "instructor_id": instructors_by_email["vikram.anand@nfolksdata.com"].id,
                "delivery_date": date(2025, 2, 18),
                "feedback": {
                    "course_name": c4.course_name,
                    "course_code": c4.nfolks_course_code,
                    "nps_score": 10,
                    "feedback_text": (
                        "Vikram made enterprise integration with App Connect and MQ feel straightforward and intuitive. "
                        "The ESQL transformation exercises and container deployment tips were directly applicable to our client project."
                    ),
                },
            },
            {
                "student_name": "Claire Dupont",
                "student_email": "claire.dupont@bnp.fr",
                "student_demographics": "EU West - Retail Banking Security",
                "company": "BNP Paribas",
                "company_industry": "Banking & Financial Services",
                "role": "Security Compliance Officer",
                "location": "Paris, France",
                "modality": "ILT",
                "course_name": c2.course_name,
                "course_id": c2.id,
                "instructor_id": instructors_by_email["marcus.vance@nfolksdata.com"].id,
                "delivery_date": date(2025, 2, 28),
                "feedback": {
                    "course_name": c2.course_name,
                    "course_code": c2.nfolks_course_code,
                    "nps_score": 10,
                    "feedback_text": (
                        "Superb delivery. The zero-trust conditional access policies and FIDO2 passwordless configuration "
                        "will directly shape our European regulatory compliance strategy."
                    ),
                },
            },
        ]

        for ddata in deliveries_data:
            fb_info = ddata.pop("feedback")
            deliv = Delivery(**ddata)
            session.add(deliv)
            session.flush()

            fb = DeliveryFeedback(
                delivery_id=deliv.id,
                course_name=fb_info["course_name"],
                course_code=fb_info["course_code"],
                nps_score=fb_info["nps_score"],
                feedback_text=fb_info["feedback_text"],
            )
            session.add(fb)
            print(f"  Created Delivery: {deliv.student_name} ({deliv.company}) -> NPS {fb.nps_score}/10")

        session.commit()
        print("\nSUCCESS! Database seeded completely with demo data.")
        print("Summary:")
        print(f"  - Instructors: {session.query(Instructor).count()}")
        print(f"  - Instructor Users: {session.query(User).filter(User.role == UserRole.instructor).count()}")
        print(f"  - Admin Users: {session.query(User).filter(User.role == UserRole.admin).count()}")
        print(f"  - Courses: {session.query(Course).count()}")
        print(f"  - Lessons: {session.query(Lesson).count()} (including YouTube, MP4 videos, PDFs, and Articles)")
        print(f"  - Deliveries: {session.query(Delivery).count()}")
        print(f"  - Feedback: {session.query(DeliveryFeedback).count()}")

    except Exception as e:
        session.rollback()
        print(f"ERROR during seed: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
