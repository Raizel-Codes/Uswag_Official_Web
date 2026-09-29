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

  const chip = "inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold";
  const action =
    "rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10.5px] font-bold text-forest hover:bg-mist transition-colors disabled:opacity-50";

  return (
    <div className="mt-1.5 space-y-1.5">
      {hasTags && (
        <div className="flex flex-wrap gap-1.5">
          {member.submittedByProxy && (
            <span className={`${chip} bg-mist text-primary`}>
              Via a friend{member.proxyName ? `: ${member.proxyName}` : ""}
            </span>
          )}
          {isPending && member.nameMatches > 0 && (
            <span className={`${chip} bg-amber-50 text-amber-700`} title="Another member account has the same name. Check the student ID before approving.">
              Same name as {member.nameMatches} other{member.nameMatches > 1 ? "s" : ""}. Check ID
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {showIdButton &&
          (studentId ? (
            <span className="rounded-lg bg-mist px-2.5 py-1 font-mono text-[11.5px] font-semibold text-forest">
              <span className="sr-only">Student ID: </span>
              {studentId}
            </span>
          ) : (
            <button type="button" onClick={onRevealId} disabled={busy === "id"} className={action}>
              {busy === "id" ? "Loading…" : "Show student ID"}
            </button>
          ))}
        {member.awaitingPasswordSetup && !link && (
          <button type="button" onClick={onCreateLink} disabled={busy === "link"} className={action}>
            {busy === "link" ? "Creating…" : "Password setup link"}
          </button>
        )}
      </div>

      {link && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-[11px] font-semibold text-amber-800">
            Give this only to {member.name}, in person. It works once and expires in 1 hour.
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              readOnly
              value={link}
              aria-label={`Password setup link for ${member.name}`}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1 font-mono text-[10.5px] text-forest"
            />
            <button type="button" onClick={onCopy} className={action}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[11px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
