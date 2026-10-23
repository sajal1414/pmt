import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Course, Lesson } from "@/lib/types";

export function useCourses(
  params: Record<string, string | number | undefined> = {},
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => apiGet<Course[]>("/v1/courses", params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: options?.staleTime,
  });
}

export function useCourse(id: number | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => apiGet<Course>(`/v1/courses/${id}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (!id) return undefined;
      const allQueries = queryClient.getQueriesData<Course[]>({ queryKey: ["courses"] });
      for (const [, list] of allQueries) {
        if (Array.isArray(list)) {
          const match = list.find((c) => c && c.id === id);
          if (match) return match;
        }
      }
      return undefined;
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(["courses", id])?.dataUpdatedAt,
  });
}

export function useLessons(courseId: number | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "lessons"],
    queryFn: () => apiGet<Lesson[]>(`/v1/courses/${courseId}/lessons`),
    enabled: !!courseId,
    placeholderData: keepPreviousData,
  });
}

export function useLessonAttachment(lessonId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["lessons", lessonId, "attachment"],
    queryFn: () => apiGet<{ playback_url: string; content_type: string | null }>(`/v1/lessons/${lessonId}/attachment`),
    enabled: enabled && !!lessonId,
  });
}
