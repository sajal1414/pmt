import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Instructor } from "@/lib/types";

export function useInstructors(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ["instructors", params],
    queryFn: () => apiGet<Instructor[]>("/v1/instructors", params),
  });
}

export function useInstructor(id: number | undefined) {
  return useQuery({
    queryKey: ["instructors", id],
    queryFn: () => apiGet<Instructor>(`/v1/instructors/${id}`),
    enabled: !!id,
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Instructor>) => apiPost<Instructor>("/v1/instructors", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Instructor> }) =>
      apiPut<Instructor>(`/v1/instructors/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/v1/instructors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
