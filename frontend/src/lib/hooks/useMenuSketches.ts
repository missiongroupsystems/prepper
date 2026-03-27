'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as api from '@/lib/api';
import type { UpdateMenuSketchRequest } from '@/types';

const SKETCHES_KEY = 'menu-sketches';

export function useMenuSketches() {
  return useQuery({
    queryKey: [SKETCHES_KEY],
    queryFn: () => api.getMenuSketches(),
  });
}

export function useMenuSketch(id: number | null) {
  return useQuery({
    queryKey: [SKETCHES_KEY, id],
    queryFn: () => api.getMenuSketch(id!),
    enabled: id !== null,
  });
}

export function useCreateMenuSketch() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (name?: string) => api.createMenuSketch(name ? { name } : {}),
    onSuccess: (sketch) => {
      queryClient.invalidateQueries({ queryKey: [SKETCHES_KEY] });
      router.push(`/menu-sketch/${sketch.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create sketch');
    },
  });
}

export function useUpdateMenuSketch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMenuSketchRequest }) =>
      api.updateMenuSketch(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SKETCHES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SKETCHES_KEY, variables.id] });
    },
  });
}

export function useDeleteMenuSketch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMenuSketch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SKETCHES_KEY] });
      toast.success('Sketch deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete sketch');
    },
  });
}

export function useForkMenuSketch() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: number) => api.forkMenuSketch(id),
    onSuccess: (sketch) => {
      queryClient.invalidateQueries({ queryKey: [SKETCHES_KEY] });
      toast.success('Sketch forked');
      router.push(`/menu-sketch/${sketch.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fork sketch');
    },
  });
}
