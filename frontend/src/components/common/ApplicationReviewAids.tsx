import { useState } from "react";
import type { MemberProfile } from "@/types/member.types";
import { revealStudentId, createSetupLink } from "@/services/memberService";

// Review aids for a membership application, shown under the applicant's name in the
// Secretary's (MemberManagementPage) and Super Admin's (SuperAdminMembersPage) lists:
// - "Via a friend": submitted from someone else's device (the helper's name is shown
//   until the application is decided, then deleted server-side)
// - "Same name as N other": a flag only — the student ID decides, not the name
// - Show student ID: decrypted on request, audit-logged; gone once decided
// - Password setup link: one-time, 1-hour link for a friend-assisted applicant, to be
//   handed over in person (there is no email delivery yet)
// The server enforces every one of these (requireOfficerPosition('SECRETARY')).

function apiMessage(err: unknown, fallback: string) {
  return (err as any)?.response?.data?.message ?? fallback;
}

export default function ApplicationReviewAids({ member }: { member: MemberProfile }) {
  const isPending = member.status === "pending";
  const [studentId, setStudentId] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<"id" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const showIdButton = isPending && member.studentIdOnFile;
  const hasTags = member.submittedByProxy || (isPending && member.nameMatches > 0);
  if (!hasTags && !showIdButton && !member.awaitingPasswordSetup) return null;

  async function onRevealId() {
    setBusy("id");
    setError(null);
    try {
      setStudentId(await revealStudentId(member.id));
    } catch (err) {
      setError(apiMessage(err, "Couldn’t load the student ID."));
    } finally {
      setBusy(null);
    }
  }

  async function onCreateLink() {
    setBusy("link");
    setError(null);
    setCopied(false);
    try {
      setLink((await createSetupLink(member.id)).url);
    } catch (err) {
      setError(apiMessage(err, "Couldn’t create a setup link."));
    } finally {
      setBusy(null);
    }
  }

  async function onCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      /* clipboard blocked — the link is selectable below */
    }
  }

  // Rendered inside the admin console (portal styles: .mp-standing chips, .mp-btn, .ap-input).
  return (
    <div className="mt-2 space-y-2">
      {hasTags && (
        <div className="flex flex-wrap gap-1.5">
          {member.submittedByProxy && (
            <span className="mp-standing mp-standing--info !tracking-[0.06em]">
              Via a friend{member.proxyName ? `: ${member.proxyName}` : ""}
            </span>
          )}
          {isPending && member.nameMatches > 0 && (
            <span className="mp-standing mp-standing--pending !tracking-[0.06em]" title="Another member account has the same name. Check the student ID before approving.">
              Same name as {member.nameMatches} other{member.nameMatches > 1 ? "s" : ""}. Check ID
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {showIdButton &&
          (studentId ? (
            <span className="inline-flex items-center min-h-[40px] rounded-[3px] bg-[rgb(152_203_176/0.22)] px-3 font-mono text-[0.875rem] font-semibold">
              <span className="mp-sr-only">Student ID: </span>
              {studentId}
            </span>
          ) : (
            <button type="button" onClick={onRevealId} disabled={busy === "id"} className="mp-btn mp-btn--ghost mp-btn--sm">
              {busy === "id" ? "Loading…" : "Show student ID"}
            </button>
          ))}
        {member.awaitingPasswordSetup && !link && (
          <button type="button" onClick={onCreateLink} disabled={busy === "link"} className="mp-btn mp-btn--ghost mp-btn--sm">
            {busy === "link" ? "Creating…" : "Password setup link"}
          </button>
        )}
      </div>

      {link && (
        <div className="mp-note mp-note--warn !block text-[0.875rem]">
          <p className="font-semibold">Give this only to {member.name}, in person. It works once and expires in 1 hour.</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={link}
              aria-label={`Password setup link for ${member.name}`}
              onFocus={(e) => e.currentTarget.select()}
              className="ap-input !min-h-[40px] font-mono !text-[0.8125rem] min-w-0 flex-1"
            />
            <button type="button" onClick={onCopy} className="mp-btn mp-btn--primary mp-btn--sm">
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mp-alert !py-2 !text-[0.875rem]">
          {error}
        </p>
      )}
    </div>
  );
}
