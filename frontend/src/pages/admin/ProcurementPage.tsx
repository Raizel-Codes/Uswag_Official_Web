import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPurchaseRequests,
  listSuppliers,
  submitPurchaseRequest,
} from '@/services/procurementService';
import type { PurchaseRequest, Supplier } from '@/types/procurement.types';

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const [item, setItem] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [event, setEvent] = useState('');

  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ['procurement', 'requests'],
    queryFn: listPurchaseRequests,
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['procurement', 'suppliers'],
    queryFn: listSuppliers,
  });

  const createRequestMutation = useMutation({
    mutationFn: submitPurchaseRequest,
    onSuccess: () => {
      setItem('');
      setEstimatedCost('');
      setEvent('');
      queryClient.invalidateQueries({ queryKey: ['procurement', 'requests'] });
      alert('Purchase request submitted');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !estimatedCost) return;
    createRequestMutation.mutate({ item, estimatedCost: Number(estimatedCost), event });
  };

  return (
    <div className="min-h-screen bg-mist px-5 pt-6 pb-24">
      {/* App Bar */}
      <div className="mb-6">
        <h1 className="font-heading text-[19px] font-bold text-forest leading-tight mb-0.5">Procurement</h1>
        <div className="text-[12px] text-gray-500">Manage purchase requests and suppliers</div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">New Purchase Request</h3>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-4 shadow-sm mb-6">
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-bold mb-1.5 text-forest">Item / Description</label>
            <input 
              type="text" 
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-100 text-[13px] bg-gray-50 outline-none focus:border-primary/50 focus:bg-white transition-colors"
              placeholder="e.g. 50x Reusable Water Bottles"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-bold mb-1.5 text-forest">Est. Cost (₱)</label>
              <input 
                type="number" 
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-100 text-[13px] bg-gray-50 outline-none focus:border-primary/50 focus:bg-white transition-colors"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold mb-1.5 text-forest">Event (Optional)</label>
              <input 
                type="text" 
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-100 text-[13px] bg-gray-50 outline-none focus:border-primary/50 focus:bg-white transition-colors"
                placeholder="e.g. Welcome Assembly"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={createRequestMutation.isPending}
            className="w-full mt-2 bg-primary text-white font-bold text-[13px] py-3.5 rounded-xl shadow-sm hover:bg-primary-light transition-colors"
          >
            {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Recent Requests</h3>
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {isLoading ? (
          <div className="text-[12.5px] text-gray-500 bg-white p-4 rounded-2xl shadow-sm text-center">Loading...</div>
        ) : requests?.length === 0 ? (
          <div className="text-[12.5px] text-gray-500 bg-white p-4 rounded-2xl shadow-sm text-center">No requests found.</div>
        ) : (
          requests?.map((req: any) => (
            <div key={req.id} className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm items-center">
              <div className="w-[38px] h-[38px] rounded-xl bg-mist flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] stroke-primary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-[13px] font-bold text-forest truncate">{req.item}</h4>
                <div className="text-[11px] text-gray-500 mt-0.5">₱{req.estimatedCost} {req.event ? `· ${req.event}` : ''}</div>
              </div>
              <span className={`text-[10px] font-bold px-[9px] py-1 rounded-full whitespace-nowrap ${
                req.status === 'APPROVED' ? 'bg-successBg text-success' : 
                req.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 
                'bg-amber-50 text-amber-600'
              }`}>
                {req.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Supplier Directory</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {suppliers?.length === 0 ? (
          <div className="text-[12.5px] text-gray-500 bg-white p-4 rounded-2xl shadow-sm text-center">No suppliers in directory.</div>
        ) : (
          suppliers?.map((supplier: any) => (
            <div key={supplier.id} className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm items-center">
              <div className="w-[38px] h-[38px] rounded-xl bg-mist flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-primary">{supplier.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-[13px] font-bold text-forest truncate">{supplier.name}</h4>
                <div className="text-[11px] text-gray-500 mt-0.5">{supplier.category || 'General'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
