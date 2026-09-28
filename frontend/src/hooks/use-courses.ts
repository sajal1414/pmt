import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Course, Lesson } from "@/lib/types";

export function useCourses(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => apiGet<Course[]>("/v1/courses", params),
  });
}

export function useCourse(id: number | undefined) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => apiGet<Course>(`/v1/courses/${id}`),
    enabled: !!id,
  });
}

export function useLessons(courseId: number | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "lessons"],
    queryFn: () => apiGet<Lesson[]>(`/v1/courses/${courseId}/lessons`),
    enabled: !!courseId,
  });
}

export function useLessonAttachment(lessonId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["lessons", lessonId, "attachment"],
    queryFn: () => apiGet<{ playback_url: string; content_type: string | null }>(`/v1/lessons/${lessonId}/attachment`),
    enabled: enabled && !!lessonId,
  });
}
