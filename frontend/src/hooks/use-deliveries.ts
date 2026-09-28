import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { Delivery, DeliveryFeedback } from "@/lib/types";

export function useDeliveries(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ["deliveries", params],
    queryFn: () => apiGet<Delivery[]>("/v1/deliveries", params),
  });
}

export function useDeliveryFeedback(deliveryId: number | undefined) {
  return useQuery({
    queryKey: ["deliveries", deliveryId, "feedback"],
    queryFn: () => apiGet<DeliveryFeedback[]>(`/v1/deliveries/${deliveryId}/feedback`),
    enabled: !!deliveryId,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Delivery>) => apiPost<Delivery>("/v1/deliveries", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useCreateDeliveryFeedback(deliveryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DeliveryFeedback>) => apiPost<DeliveryFeedback>(`/v1/deliveries/${deliveryId}/feedback`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries", deliveryId, "feedback"] }),
  });
}
