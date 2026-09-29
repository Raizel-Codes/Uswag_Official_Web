// Member Management
// Approve applications, issue/revoke QR. Primary owner: Secretary.
// Any non-Secretary hitting this page sees LockedState — the server also
// enforces this via requireOfficerPosition('SECRETARY') in member.routes.ts.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  listMembers,
  approveApplication,
  rejectApplication,
} from "@/services/memberService";
import { ForbiddenError } from "@/services/api";
import LockedState from "@/components/common/LockedState";
import ApplicationReviewAids from "@/components/common/ApplicationReviewAids";
import type { MemberProfile } from "@/types/member.types";
import { createManualPost } from "@/services/postService";
import { isSuperAdminEquivalent } from "@/utils/roles";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-successBg text-success",
  PENDING: "bg-amber-50 text-amber-600",
  EXPIRED: "bg-gray-100 text-gray-500",
  REJECTED: "bg-red-50 text-red-500",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Member row
// ---------------------------------------------------------------------------
function MemberRow({
  member,
  onApprove,
  onReject,
  isPending,
}: {
  member: MemberProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isPending?: boolean;
}) {
  const [confirmReject, setConfirmReject] = useState(false);

  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist font-heading text-[12px] font-bold text-primary">
        {initials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-forest truncate">{member.name}</div>
        <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
          {member.collegeOrDept} · {member.serialNumber || "No serial yet"}
        </div>
        {isPending && (
          <div className="text-[10px] text-gray-400 mt-0.5">
            Applied {formatDate(member.joinedAt)}
          </div>
        )}
        <ApplicationReviewAids member={member} />
      </div>

      {/* Action buttons for pending; badge for active */}
      {isPending && onApprove && onReject ? (
        confirmReject ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              id={`btn-confirm-reject-${member.id}`}
              onClick={() => onReject(member.id)}
              className="rounded-xl bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmReject(false)}
              className="rounded-xl bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5 shrink-0">
            <button
              id={`btn-approve-${member.id}`}
              onClick={() => onApprove(member.id)}
              className="rounded-xl bg-successBg px-2.5 py-1.5 text-[10px] font-bold text-success hover:bg-green-100 transition-colors"
            >
              Approve
            </button>
            <button
              id={`btn-reject-${member.id}`}
              onClick={() => setConfirmReject(true)}
              className="rounded-xl bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        )
      ) : (
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " +
            (STATUS_BADGE[member.status.toUpperCase()] ?? "bg-gray-100 text-gray-500")
          }
        >
          {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  function show(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }
  return { toast, show };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MemberManagementPage() {
  const { user } = useAuth();

  // ---- Secretary guard — only Secretary (or Super Admin/VP) may manage members ----
  // This check gives an instant optimistic lock before the network call.
  // The real enforcement is requireOfficerPosition('SECRETARY') in
  // member.routes.ts, which the VP passes automatically as Super-Admin-
  // equivalent (see role.middleware.ts / utils/roles.ts). In practice the VP
  // is routed to SuperAdminMembersPage instead (AdminMembersHomePage.tsx);
  // this stays here as the defensive fallback for a direct hit on this page.
  const canManage =
    isSuperAdminEquivalent(user) || user?.officerPosition === "secretary";

  if (!canManage) {
    return (
      <div className="min-h-screen bg-mist px-5 py-6 pb-24">
        <h1 className="font-heading text-[19px] font-bold text-forest mb-1">Members</h1>
        <p className="text-[12px] text-gray-500 mb-4">Approve applications & maintain the roster</p>
        <LockedState
          title="Member Management is Outside Your Scope"
          description="Only the Secretary (and Super Admin) may approve applications and maintain member records, per Article VI §2(c) of the USWAG Constitution."
          redirectLabel="Contact the Secretary to manage membership"
        />
      </div>
    );
  }

  return <MemberManagementContent />;
}

// Separate component so hooks are never called for locked-out roles
function MemberManagementContent() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "all" | "minutes" | "announcements">("pending");
  const [postBody, setPostBody] = useState("");
  const { toast, show: showToast } = useToast();
  const queryClient = useQueryClient();

  // Pending applications
  const {
    data: pending,
    isLoading: isPendingLoading,
    error: pendingError,
  } = useQuery<MemberProfile[]>({
    queryKey: ["members", "pending"],
    queryFn: () => listMembers({ status: "pending" }),
    staleTime: 30_000,
  });

  // Active/all members
  const {
    data: active,
    isLoading: isActiveLoading,
    error: activeError,
  } = useQuery<MemberProfile[]>({
    queryKey: ["members", "active", search],
    queryFn: () => listMembers({ status: activeTab === "all" ? undefined : "active", search }),
    staleTime: 30_000,
    enabled: activeTab !== "pending",
  });

  const approveMutation = useMutation({
    mutationFn: (memberId: string) => approveApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      showToast("Application approved ✓");
    },
    onError: (err: unknown) => {
      if (err instanceof ForbiddenError) {
        showToast("Permission denied — Secretary access only");
      } else {
        showToast("Failed to approve application");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => rejectApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      showToast("Application rejected");
    },
    onError: (err: unknown) => {
      if (err instanceof ForbiddenError) {
        showToast("Permission denied — Secretary access only");
      } else {
        showToast("Failed to reject application");
      }
    },
  });

  const postMutation = useMutation({
    mutationFn: ({ body, type }: { body: string, type: 'MINUTE' | 'ANNOUNCEMENT' }) => createManualPost(body, undefined, type),
    onSuccess: () => {
      setPostBody("");
      showToast("Post published successfully");
    },
    onError: () => {
      showToast("Failed to publish post");
    }
  });

  const handlePublishPost = () => {
    if (!postBody.trim()) return;
    const type = activeTab === "minutes" ? "MINUTE" : "ANNOUNCEMENT";
    postMutation.mutate({ body: postBody, type });
  };

  // Show LockedState if the backend returned 403 (shouldn't normally happen if
  // the optimistic role check above fired, but guards against edge cases)
  const isForbidden =
    pendingError instanceof ForbiddenError || activeError instanceof ForbiddenError;

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-mist px-5 py-6 pb-24">
        <h1 className="font-heading text-[19px] font-bold text-forest mb-1">Members</h1>
        <LockedState
          title="Access Denied by Server"
          description="The server confirmed that member management is outside your officer role's scope. This page is restricted to the Secretary and Super Admin."
          redirectLabel="Article VI §2(c) — Secretary's scope"
        />
      </div>
    );
  }

  const pendingList = pending ?? [];
  const displayList = activeTab === "pending" ? [] : active ?? [];

  return (
    <div className="min-h-screen bg-mist pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">Members</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">Approve applications & maintain the roster</p>
      </div>

      <div className="px-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="font-heading text-[18px] font-extrabold text-amber-500">
              {pendingList.length}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Pending</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="font-heading text-[18px] font-extrabold text-primary">
              {isActiveLoading ? "—" : (active?.length ?? 0)}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Active</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="font-heading text-[18px] font-extrabold text-forest">
              {approveMutation.isPending || rejectMutation.isPending ? "…" : "✓"}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Actions</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["pending", "active", "all", "minutes", "announcements"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-members-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={
                "flex-1 min-w-[30%] rounded-xl py-2 text-[11px] font-bold transition-colors " +
                (activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm")
              }
            >
              {tab === "pending"
                ? `Pending${pendingList.length > 0 ? ` (${pendingList.length})` : ""}`
                : tab === "active"
                ? "Active"
                : tab === "all" ? "All"
                : tab === "minutes" ? "Minutes" : "Announcements"}
            </button>
          ))}
        </div>

        {/* Search (only for Active/All tabs) */}
        {activeTab !== "pending" && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5 mb-4 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 stroke-gray-400 shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="input-member-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-[13px] text-forest outline-none placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Pending tab content */}
        {activeTab === "pending" && (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-heading text-[14px] font-bold text-forest">Pending Applications</h3>
              {pendingList.length > 0 && (
                <span className="text-[11px] font-semibold text-amber-500">
                  {pendingList.length} awaiting review
                </span>
              )}
            </div>

            {isPendingLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : pendingList.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
                <p className="text-[12.5px] font-medium text-gray-500">No pending applications.</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  All caught up! New applications will appear here.
                </p>
              </div>
            ) : (
              pendingList.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isPending
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                />
              ))
            )}
          </>
        )}

        {/* Active / All tab content */}
        {activeTab !== "pending" && (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-heading text-[14px] font-bold text-forest">
                {activeTab === "active" ? "Active Members" : "All Members"}
              </h3>
              {!isActiveLoading && (
                <span className="text-[11px] font-semibold text-primary">
                  {displayList.length} shown
                </span>
              )}
            </div>

            {isActiveLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : displayList.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
                <p className="text-[12.5px] font-medium text-gray-500">
                  {search ? "No members match your search." : "No members found."}
                </p>
              </div>
            ) : (
              displayList.map((m) => <MemberRow key={m.id} member={m} />)
            )}
          </>
        )}

        {/* Minutes / Announcements Composer */}
        {(activeTab === "minutes" || activeTab === "announcements") && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-heading text-[14px] font-bold text-forest">
                {activeTab === "minutes" ? "Publish Meeting Minutes" : "Post Announcement"}
              </h3>
            </div>
            <textarea 
              placeholder={activeTab === "minutes" ? "Paste meeting minutes here..." : "Write an update for members..."}
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-100 text-[13px] bg-white shadow-sm outline-none text-forest min-h-[120px] resize-y mb-3 focus:border-primary/50 transition-colors"
            />
            <button 
              onClick={handlePublishPost}
              disabled={postMutation.isPending || !postBody.trim()}
              className="w-full p-3.5 rounded-xl bg-primary text-white font-bold text-[13px] hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {postMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-forest px-4 py-3 text-[12px] font-semibold text-white shadow-lg animate-fade-in">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 stroke-[#7ee6a8] shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
