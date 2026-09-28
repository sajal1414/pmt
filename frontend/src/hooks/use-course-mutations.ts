import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Course, Lesson } from "@/lib/types";

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Course>) => apiPost<Course>("/v1/courses", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Course> }) => apiPut<Course>(`/v1/courses/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/v1/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useCreateLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Lesson>) => apiPost<Lesson>(`/v1/courses/${courseId}/lessons`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", courseId, "lessons"] }),
  });
}

export function useUpdateLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Lesson> }) => apiPut<Lesson>(`/v1/lessons/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", courseId, "lessons"] }),
  });
}

export function useDeleteLesson(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/v1/lessons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", courseId, "lessons"] }),
  });
}
