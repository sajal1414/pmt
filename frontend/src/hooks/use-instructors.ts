import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Instructor } from "@/lib/types";

export function useInstructors(
  params: Record<string, string | number | undefined> = {},
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: ["instructors", params],
    queryFn: () => apiGet<Instructor[]>("/v1/instructors", params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: options?.staleTime,
  });
}

export function useInstructor(id: number | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["instructors", id],
    queryFn: () => apiGet<Instructor>(`/v1/instructors/${id}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (!id) return undefined;
      const allQueries = queryClient.getQueriesData<Instructor[]>({ queryKey: ["instructors"] });
      for (const [, list] of allQueries) {
        if (Array.isArray(list)) {
          const match = list.find((i) => i && i.id === id);
          if (match) return match;
        }
      }
      return undefined;
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(["instructors", id])?.dataUpdatedAt,
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
