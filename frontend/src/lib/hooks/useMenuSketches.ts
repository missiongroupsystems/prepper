'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as api from '@/lib/api';
import type {
  UpdateMenuSketchRequest,
  CreateMenuSketchSectionRequest,
  UpdateMenuSketchSectionRequest,
  CreateMenuSketchSectionItemRequest,
  UpdateMenuSketchSectionItemRequest,
  CreateMenuSketchSectionItemCommentRequest,
  UpdateMenuSketchSectionItemCommentRequest,
} from '@/types';

const SKETCHES_KEY = 'menu-sketches';
const SECTIONS_KEY = 'menu-sketch-sections';
const ITEMS_KEY = 'menu-sketch-section-items';
const COMMENTS_KEY = 'menu-sketch-comments';

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

// ─── Sections ──────────────────────────────────────────────────────────────

export function useMenuSketchSections(menuSketchId: number | null) {
  return useQuery({
    queryKey: [SECTIONS_KEY, menuSketchId],
    queryFn: () => api.getMenuSketchSections(menuSketchId!),
    enabled: menuSketchId !== null,
  });
}

export function useCreateMenuSketchSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuSketchSectionRequest) =>
      api.createMenuSketchSection(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [SECTIONS_KEY, variables.menu_sketch_id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create section');
    },
  });
}

export function useUpdateMenuSketchSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMenuSketchSectionRequest }) =>
      api.updateMenuSketchSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SECTIONS_KEY] });
    },
  });
}

export function useDeleteMenuSketchSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMenuSketchSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete section');
    },
  });
}

// ─── Items ─────────────────────────────────────────────────────────────────

export function useMenuSketchSectionItems(sectionId: number | null) {
  return useQuery({
    queryKey: [ITEMS_KEY, sectionId],
    queryFn: () => api.getMenuSketchSectionItems(sectionId!),
    enabled: sectionId !== null,
  });
}

export function useCreateMenuSketchSectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuSketchSectionItemRequest) =>
      api.createMenuSketchSectionItem(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ITEMS_KEY, variables.menu_sketch_section_id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create dish');
    },
  });
}

export function useUpdateMenuSketchSectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      prevRecipeId,
    }: {
      id: number;
      data: UpdateMenuSketchSectionItemRequest;
      prevRecipeId?: number | null;
    }) => api.updateMenuSketchSectionItem(id, data),
    onSuccess: (updatedItem, variables) => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      // Detect silent recipe fork and notify
      if (
        variables.prevRecipeId != null &&
        updatedItem.recipe_id !== variables.prevRecipeId
      ) {
        toast.success('New recipe version created (dish had tasting feedback)');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update dish');
    },
  });
}

export function useDeleteMenuSketchSectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMenuSketchSectionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete dish');
    },
  });
}

// ─── Comments ──────────────────────────────────────────────────────────────

export function useMenuSketchComments(menuSketchId: number | null) {
  return useQuery({
    queryKey: [COMMENTS_KEY, menuSketchId],
    queryFn: () => api.getMenuSketchComments(menuSketchId!),
    enabled: menuSketchId !== null,
  });
}

export function useCreateMenuSketchComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuSketchSectionItemCommentRequest) =>
      api.createMenuSketchComment(data),
    onSuccess: (_data, variables) => {
      // Find which sketch this belongs to via item id — invalidate all comments
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

export function useUpdateMenuSketchComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateMenuSketchSectionItemCommentRequest;
    }) => api.updateMenuSketchComment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
}

export function useResolveMenuSketchComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.resolveMenuSketchComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY] });
      toast.success('Comment resolved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve comment');
    },
  });
}

export function useDeleteMenuSketchComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMenuSketchComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}
