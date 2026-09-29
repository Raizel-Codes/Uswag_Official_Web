import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ForbiddenError } from '@/services/api';
import { apiError } from '@/components/admin/format';

/**
 * Approve / reject a membership application (Secretary or Super Admin — the server enforces
 * it). Refreshes the member lists and the pending count, then reports through `show`.
 */
export function useApplicationDecision(
  fn: (id: string) => Promise<unknown>,
  okMessage: string,
  show: (message: string, tone?: 'ok' | 'error') => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      show(okMessage);
    },
    onError: (err) =>
      show(err instanceof ForbiddenError ? 'Permission denied — Secretary access only' : apiError(err, 'That didn’t go through. Please try again.'), 'error'),
  });
}
