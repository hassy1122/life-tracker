import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';

function useInvalidates(...keys) {
  const qc = useQueryClient();
  return (extra = []) => {
    qc.invalidateQueries({ queryKey: keys[0] });
    for (const key of keys.slice(1)) qc.invalidateQueries({ queryKey: key });
    for (const key of extra) qc.invalidateQueries({ queryKey: key });
  };
}

// ----- queries -----

export function useSummary() {
  return useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => api('/stats/summary'),
    staleTime: 15_000,
  });
}

export function useHeatmap(days = 84) {
  return useQuery({
    queryKey: ['stats', 'heatmap', days],
    queryFn: () => api(`/stats/heatmap?days=${days}`),
    staleTime: 60_000,
  });
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api('/habits'),
  });
}

export function useHabitHistory(id, from, to) {
  return useQuery({
    queryKey: ['habit', id, 'history', from, to],
    queryFn: () => api(`/habits/${id}/history?from=${from}&to=${to}`),
    enabled: Boolean(id),
  });
}

export function useTasks(params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return useQuery({
    queryKey: ['tasks', search],
    queryFn: () => api(`/tasks${search ? `?${search}` : ''}`),
  });
}

// ----- mutations -----

export function useLogHabit() {
  const invalidate = useInvalidates(['habits'], ['stats'], ['habit']);
  return useMutation({
    mutationFn: ({ id, date, completed }) =>
      api(`/habits/${id}/log`, { method: 'POST', body: { date, completed } }),
    onSuccess: () => invalidate(),
  });
}

export function useCreateHabit() {
  const invalidate = useInvalidates(['habits'], ['stats']);
  return useMutation({
    mutationFn: (body) => api('/habits', { method: 'POST', body }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidates(['habits'], ['stats']);
  return useMutation({
    mutationFn: ({ id, ...body }) => api(`/habits/${id}`, { method: 'PUT', body }),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidates(['habits'], ['stats']);
  return useMutation({
    mutationFn: (id) => api(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
}

export function useCreateTask() {
  const invalidate = useInvalidates(['tasks'], ['stats']);
  return useMutation({
    mutationFn: (body) => api('/tasks', { method: 'POST', body }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidates(['tasks'], ['stats']);
  return useMutation({
    mutationFn: ({ id, ...body }) => api(`/tasks/${id}`, { method: 'PUT', body }),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidates(['tasks'], ['stats']);
  return useMutation({
    mutationFn: (id) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  });
}
