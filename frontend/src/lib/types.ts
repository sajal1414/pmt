export type CourseStatus =
  | "available"
  | "in_development"
  | "retired"
  | "pipeline"
  | "backlog";

export type CourseOutlineStatus = "missing" | "not_yet_scoped" | "draft" | "partially_complete" | "validated";
export type LabLocation = "ITZ" | "nFolks" | "instructor_owned" | "na";
export type IPOwner = "nFolks" | "SubK";
export type SkillLevel = "foundational" | "intermediate" | "advanced";
export type TravelPreference = "can_travel" | "virtual_only" | "in_person_only" | "both";

export interface Course {
  id: number;
  vendor: string | null;
  platform: string | null;
  portfolio: string | null;
  product: string | null;
  nfolks_course_code: string;
  ibm_course_codes: string | null;
  status: CourseStatus;
  course_name: string;
  course_outline_status: CourseOutlineStatus | null;
  modality: string | null;
  duration_days: string | null;
  num_hours: string | null;
  on_ibm_pmt: string | null;
  lab_location: LabLocation | null;
  ibm_retirement_date: string | null;
  ip_owner: IPOwner | null;
  course_author_email: string | null;
  planned_completion_date: string | null;
  release_date: string | null;
  retire_date: string | null;
  course_description: string | null;
  link_to_course_outline: string | null;
  course_outline_s3_key: string | null;
  skill_level: SkillLevel | null;
  max_students: number | null;
  pre_reqs: string | null;
  persona_audience_type: string | null;
  lab_configuration: string | null;
  course_technical_requirements: string | null;
  delivery_instruction_notes: string | null;
  instructor_daily_rate: string | null;
  materials_cost: string | null;
  lab_cost: string | null;
  learning_path: string | null;
  badge: string | null;
  certification: string | null;
  notes: string | null;
  record_source: string | null;
  created_at: string;
  updated_at: string;
  instructors?: Instructor[];
  instructor_ids?: number[];
  instructor?: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sequence_order: number;
  duration_minutes: number | null;
  attachment_url: string | null;
  attachment_s3_key: string | null;
  attachment_content_type: string | null;
  created_at: string;
}

export interface Instructor {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  travel_preference: TravelPreference | null;
  languages: string | null;
  vendor: string | null;
  platform: string | null;
  portfolio: string | null;
  product: string | null;
  skills_products: string | null;
  courses_can_teach: string | null;
  external_courses_owned?: string | null;
  feedback_score: string | null;
  comments: string | null;
  created_at: string;
  courses_owned?: Array<{
    id: number | null;
    course_name: string;
    nfolks_course_code: string | null;
    status: CourseStatus | "external";
    in_repository: boolean;
  }>;
}

export interface Delivery {
  id: number;
  student_name: string | null;
  student_email: string | null;
  student_demographics: string | null;
  company: string | null;
  company_industry: string | null;
  role: string | null;
  location: string | null;
  modality: string | null;
  course_name: string | null;
  course_id: number | null;
  instructor_id: number | null;
  delivery_date: string | null;
  created_at: string;
}

export interface AppUser {
  id: number;
  email: string;
  full_name: string | null;
  role: "admin" | "instructor";
  instructor_id: number | null;
  must_change_password: boolean;
  created_at: string;
}

export interface DeliveryFeedback {
  id: number;
  delivery_id: number;
  course_name: string | null;
  course_code: string | null;
  nps_score: number | null;
  feedback_text: string | null;
  created_at: string;
}
