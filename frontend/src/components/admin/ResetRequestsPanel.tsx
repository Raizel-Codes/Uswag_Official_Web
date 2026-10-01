import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissResetRequest, issueResetLink } from '@/services/memberService';
import { RESET_REQUESTS_KEY, useResetRequests } from '@/hooks/useResetRequests';
import type { ResetRequest } from '@/types/member.types';
import Panel from '@/components/portal/Panel';
import { apiError, initials, timeAgo } from '@/components/admin/format';

// People who can't sign in and asked an officer for help (the no-email way back in). The officer's job
// here is to be sure it's really them — the student ID check is a signal, not proof — and then hand
// over the one-time link privately. The server decides who sees which requests and enforces it
// (services/resetRequest.service.ts): the Secretary handles members; the Super Admin / VP handle
// officers' accounts. Every link issued and every dismissal is audit-logged.

const ID_CHECK = {
  matched: { label: 'Student ID matched', cls: 'mp-standing--active' },
  mismatch: { label: 'Student ID did NOT match', cls: 'mp-standing--rejected' },
  unchecked: { label: 'Student ID couldn’t be checked', cls: 'mp-standing--expired' },
} as const;

interface Issued {
  name: string;
  url: string;
  expiresInMinutes: number;
}

export default function ResetRequestsPanel({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useResetRequests();
  const [openId, setOpenId] = useState<string | null>(null); // the row whose "create link" form is open
  const [confirmed, setConfirmed] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: RESET_REQUESTS_KEY });

  const issue = useMutation({
    mutationFn: ({ r, identityConfirmed }: { r: ResetRequest; identityConfirmed: boolean }) =>
      issueResetLink(r.userId, identityConfirmed).then((link) => ({ link, name: r.name })),
    onSuccess: ({ link, name }) => {
      setIssued({ name, url: link.url, expiresInMinutes: link.expiresInMinutes });
      setCopied(false);
      setOpenId(null);
      setError(null);
      refresh();
    },
    onError: (err) => setError(apiError(err, 'We couldn’t create the link. Please try again.')),
  });
  const dismiss = useMutation({
    mutationFn: (r: ResetRequest) => dismissResetRequest(r.userId),
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (err) => setError(apiError(err, 'We couldn’t dismiss that request. Please try again.')),
  });

  const requests = data ?? [];
  if (hideWhenEmpty && !issued && requests.length === 0) return null;

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false); // the link is also selectable in the box below
    }
  }

  return (
    <Panel
      title="Sign-in help requests"
      aside={!isLoading && <span className="mp-muted">{requests.length} open</span>}
      id="reset-requests"
      flush
    >
      {issued && (
        <div className="p-4 sm:px-6 border-b border-[rgb(20_39_24/0.1)] space-y-3" role="status">
          <p className="font-semibold">Private link for {issued.name}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={issued.url} onFocus={(e) => e.currentTarget.select()} aria-label={`Reset link for ${issued.name}`} className="ap-input flex-1 font-mono text-[0.8125rem]" />
            <button type="button" onClick={() => copy(issued.url)} className="mp-btn mp-btn--primary mp-btn--sm shrink-0">
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <p className="mp-muted text-[0.8125rem]">
            Works once and expires in {issued.expiresInMinutes} minutes. Give it only to {issued.name}, directly. Don’t post it in a group chat.
            It can’t be shown again once you close this; if it’s lost, they can ask again.
          </p>
          <button type="button" onClick={() => setIssued(null)} className="mp-btn mp-btn--ghost mp-btn--sm">Done</button>
        </div>
      )}

      {error && <p role="alert" className="mp-alert mx-4 sm:mx-6 my-3">{error}</p>}

      {isLoading ? (
        <div className="p-5 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
      ) : isError ? (
        <div className="p-8 text-center">
          <p className="mp-muted">We couldn’t load the requests.</p>
          <button type="button" onClick={() => refetch()} className="mp-btn mp-btn--ghost mp-btn--sm mt-3">Try again</button>
        </div>
      ) : requests.length === 0 ? (
        <p className="p-8 mp-muted text-center">No one is waiting for help. Requests appear here, and you’re notified, when someone can’t sign in.</p>
      ) : (
        <ul className="ap-list">
          {requests.map((r) => {
            const check = r.studentIdMatched === true ? ID_CHECK.matched : r.studentIdMatched === false ? ID_CHECK.mismatch : ID_CHECK.unchecked;
            const open = openId === r.userId;
            const needsConfirm = r.studentIdMatched !== true;
            return (
              <li key={r.userId} className="ap-row items-start flex-wrap">
                <span className="ap-avatar" aria-hidden="true">{initials(r.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {r.name}
                    {r.isOfficer && <span className="mp-standing mp-standing--expired ml-2 align-middle">Officer account</span>}
                  </p>
                  <p className="mp-muted text-[0.875rem] break-words">
                    {r.collegeOrDept}
                    {r.yearLevel ? ` · ${r.yearLevel}` : ''} · {r.email}
                  </p>
                  <p className="mp-muted text-[0.8125rem] mt-0.5">Asked {timeAgo(r.requestedAt)}</p>
                  <p className="mt-2"><span className={`mp-standing ${check.cls}`}>{check.label}</span></p>

                  {open && (
                    <div className="mt-3 p-4 rounded-[3px] bg-mist space-y-3">
                      <p className="text-[0.875rem]">
                        Be sure this is really {r.name} before you continue. Find them in person, or use a way to reach them that you already trust.
                      </p>
                      {needsConfirm && (
                        <label className="flex items-start gap-2 text-[0.875rem] font-medium">
                          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                          <span>
                            {r.studentIdMatched === false ? 'The student ID didn’t match, but' : 'The student ID couldn’t be checked, but'} I’ve confirmed it’s them another way.
                          </span>
                        </label>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={issue.isPending || (needsConfirm && !confirmed)}
                          onClick={() => issue.mutate({ r, identityConfirmed: needsConfirm && confirmed })}
                          className="mp-btn mp-btn--primary mp-btn--sm"
                        >
                          {issue.isPending ? 'Creating…' : 'Create private link'}
                        </button>
                        <button type="button" onClick={() => setOpenId(null)} className="mp-btn mp-btn--ghost mp-btn--sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                {!open && (
                  <div className="flex gap-2 w-full sm:w-auto shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(r.userId);
                        setConfirmed(false);
                        setError(null);
                      }}
                      className="mp-btn mp-btn--primary mp-btn--sm"
                    >
                      Review<span className="mp-sr-only"> request from {r.name}</span>
                    </button>
                    <button type="button" disabled={dismiss.isPending} onClick={() => dismiss.mutate(r)} className="mp-btn mp-btn--ghost mp-btn--sm">
                      Dismiss<span className="mp-sr-only"> request from {r.name}</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
