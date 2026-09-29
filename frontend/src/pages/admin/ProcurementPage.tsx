// Procurement — the Business Manager's Work module (Article VI §2): purchase requests for
// event materials and the supplier directory. Server-scoped via canManageProcurement in
// procurement.routes.ts. `?focus=new-request | suppliers` jumps to a section.

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalToast } from '@/hooks/usePortalToast';
import { useFocusParam } from '@/hooks/useFocusParam';
import { listPurchaseRequests, listSuppliers, submitPurchaseRequest } from '@/services/procurementService';
import type { PurchaseRequest, Supplier } from '@/types/procurement.types';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate from '@/components/portal/StatPlate';
import PortalToast from '@/components/portal/PortalToast';
import { apiError, currency, formatDate, initials, isThisMonth } from '@/components/admin/format';

const STATUS: Record<PurchaseRequest['status'], { cls: string; label: string }> = {
  PENDING: { cls: 'mp-standing--pending', label: 'Awaiting approval' },
  APPROVED: { cls: 'mp-standing--active', label: 'Approved' },
  REJECTED: { cls: 'mp-standing--rejected', label: 'Rejected' },
};

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const { toast, show } = usePortalToast();
  const [item, setItem] = useState('');
  const [cost, setCost] = useState('');
  const [event, setEvent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const requestsQ = useQuery<PurchaseRequest[]>({ queryKey: ['procurement', 'requests'], queryFn: listPurchaseRequests });
  const suppliersQ = useQuery<Supplier[]>({ queryKey: ['procurement', 'suppliers'], queryFn: listSuppliers });
  useFocusParam(!requestsQ.isLoading && !suppliersQ.isLoading);

  const submit = useMutation({
    mutationFn: submitPurchaseRequest,
    onSuccess: () => {
      setItem('');
      setCost('');
      setEvent('');
      queryClient.invalidateQueries({ queryKey: ['procurement', 'requests'] });
      show('Purchase request submitted');
    },
    onError: (err) => setFormError(apiError(err, 'Could not submit the request. Please try again.')),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!item.trim()) return setFormError('Describe what you need.');
    const amount = Number(cost);
    if (!cost || isNaN(amount) || amount <= 0) return setFormError('Enter an estimated cost greater than zero.');
    submit.mutate({ item: item.trim(), estimatedCost: amount, event: event.trim() });
  }

  const requests = [...(requestsQ.data ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const pending = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="mp-page space-y-8">
      <PageHeader eyebrow="Work · Business Manager" title="Procurement" lead="Request materials for events and keep the supplier directory." />

      <dl className="ap-stats-row">
        <StatPlate label="Open" value={requestsQ.data ? requests.filter((r) => r.status !== 'REJECTED').length : '…'} tone="primary" hint="Requests" />
        <StatPlate label="Awaiting" value={requestsQ.data ? pending : '…'} tone={pending ? 'warn' : 'neutral'} hint="Approval" />
        <StatPlate label="This month" value={requestsQ.data ? currency(requests.filter((r) => isThisMonth(r.createdAt)).reduce((s, r) => s + r.estimatedCost, 0)) : '…'} tone="neutral" hint="Requested" />
      </dl>

      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start">
        <Panel title="New purchase request" id="new-request" className="scroll-mt-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="pr-item" className="ap-label">Item / description</label>
              <input id="pr-item" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. 50 reusable water bottles" className="ap-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pr-cost" className="ap-label">Est. cost (₱)</label>
                <input id="pr-cost" type="number" inputMode="decimal" min="1" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className="ap-input" />
              </div>
              <div>
                <label htmlFor="pr-event" className="ap-label">
                  Event <span className="normal-case tracking-normal font-medium mp-muted">(optional)</span>
                </label>
                <input id="pr-event" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. Welcome Assembly" className="ap-input" />
              </div>
            </div>
            {formError && <p role="alert" className="mp-alert">{formError}</p>}
            <button type="submit" disabled={submit.isPending} className="mp-btn mp-btn--primary w-full sm:w-auto">
              {submit.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </form>
        </Panel>

        <Panel title="Requests" aside={requestsQ.data && <span className="mp-muted">{requests.length}</span>} flush>
          {requestsQ.isLoading ? (
            <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
          ) : requestsQ.isError ? (
            <p role="alert" className="m-5 mp-alert">{apiError(requestsQ.error, 'We couldn’t load requests.')}</p>
          ) : requests.length === 0 ? (
            <p className="p-8 mp-muted text-center">No requests yet.</p>
          ) : (
            <ul className="ap-list">
              {requests.map((r) => (
                <li key={r.id} className="ap-row items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.item}</p>
                    <p className="mp-muted text-[0.8125rem]">
                      <span className="mp-num">{currency(r.estimatedCost)}</span>
                      {r.event ? ` · ${r.event}` : ''} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <span className={`mp-standing ${STATUS[r.status].cls} shrink-0`}>{STATUS[r.status].label}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Supplier directory" id="suppliers" className="scroll-mt-6" flush>
        {suppliersQ.isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
        ) : !suppliersQ.data?.length ? (
          <p className="p-8 mp-muted text-center">No suppliers in the directory yet.</p>
        ) : (
          <ul className="ap-list sm:grid sm:grid-cols-2 sm:[&>li+li]:border-t-0 sm:[&>li]:border-b sm:[&>li]:border-[rgb(20_39_24/0.1)]">
            {suppliersQ.data.map((s) => (
              <li key={s.id} className="ap-row">
                <span className="ap-avatar" aria-hidden="true">{initials(s.name)}</span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="mp-muted text-[0.8125rem] truncate">
                    {s.category || 'General'}
                    {s.contactInfo ? ` · ${s.contactInfo}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PortalToast toast={toast} />
    </div>
  );
}
