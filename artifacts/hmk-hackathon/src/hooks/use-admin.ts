import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminSession, useAdminLogin, useAdminLogout, useDeleteRegistration, useGetAdminSummary, useListRegistrations, useGetRegistration,
  getGetAdminSessionQueryKey, getGetAdminSummaryQueryKey, getListRegistrationsQueryKey, getGetRegistrationQueryKey,
  type Session,
} from "@workspace/api-client-react";

const reqOpts = (token?: string) => ({
  credentials: "same-origin" as const,
  headers: token ? { "X-CSRF-Token": token } : undefined,
});

export function useAdminSession() {
  return useGetAdminSession({
    query: { queryKey: getGetAdminSessionQueryKey(), retry: false, staleTime: 30_000 },
    request: { credentials: "same-origin" },
  });
}

const csrfOf = (qc: ReturnType<typeof useQueryClient>) => qc.getQueryData<Session>(getGetAdminSessionQueryKey())?.csrfToken;

function clearAdminData(qc: ReturnType<typeof useQueryClient>) {
  qc.removeQueries({
    predicate: (q) => {
      const k = String(q.queryKey[0] ?? "");
      return k.startsWith("/api/admin/") && k !== "/api/admin/session";
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const session = useAdminSession();
  return useAdminLogin({
    request: reqOpts(session.data?.csrfToken),
    mutation: {
      onSuccess: (s) => {
        clearAdminData(qc);
        qc.setQueryData(getGetAdminSessionQueryKey(), s);
        qc.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
      },
      onError: () => {
        // token may have rotated / expired: refresh session for next attempt
        qc.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
      },
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const session = useAdminSession();
  return useAdminLogout({
    request: reqOpts(session.data?.csrfToken),
    mutation: {
      onSettled: () => {
        clearAdminData(qc);
        qc.setQueryData<Session>(getGetAdminSessionQueryKey(), (old) => (old ? { ...old, authenticated: false } : old));
        qc.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
      },
    },
  });
}

export function useDeleteReg() {
  const qc = useQueryClient();
  const session = useAdminSession();
  return useDeleteRegistration({
    request: reqOpts(session.data?.csrfToken ?? csrfOf(qc)),
    mutation: {
      onSuccess: (_d, vars) => {
        qc.removeQueries({ queryKey: getGetRegistrationQueryKey(vars.id) });
        qc.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
      },
    },
  });
}

export function useSummary(enabled: boolean) {
  return useGetAdminSummary({ query: { enabled, queryKey: getGetAdminSummaryQueryKey() }, request: { credentials: "same-origin" } });
}
export function useRegistrations(enabled: boolean) {
  return useListRegistrations({ query: { enabled, queryKey: getListRegistrationsQueryKey() }, request: { credentials: "same-origin" } });
}
export function useRegistrationDetail(id: number, enabled: boolean) {
  return useGetRegistration(id, { query: { enabled: enabled && Number.isFinite(id), queryKey: getGetRegistrationQueryKey(id) }, request: { credentials: "same-origin" } });
}

export const apiErrorMessage = (err: unknown, fallback: string) => {
  const e = err as { data?: { error?: string } | null } | null;
  return e?.data?.error ?? fallback;
};
