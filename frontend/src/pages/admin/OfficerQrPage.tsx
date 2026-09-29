// Officer console / admin console — QR. An officer's own signed ID, for meetings and forums
// they conduct (not tied to a UswagEvent the way the member card is — see
// backend/src/services/qr.service.ts buildOfficerQrValue). Every officer position gets one,
// including the Auditor — this is identity, not scan permission, and Article VI's "no scan
// access" limit is about scanning others, not about being identifiable yourself.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getMyOfficerQr } from '@/services/qrService';
import { isSuperAdminEquivalent } from '@/utils/roles';
import PageHeader from '@/components/portal/PageHeader';
import OfficerIdCard from '@/components/admin/OfficerIdCard';
import { apiError } from '@/components/admin/format';

export default function OfficerQrPage() {
  const { user } = useAuth();
  const card = useQuery({
    queryKey: ['officer', 'qr-card'],
    queryFn: getMyOfficerQr,
    // The QR only changes if the signing key is rotated — safe to hold for a while.
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="mp-page">
      <PageHeader
        eyebrow={isSuperAdminEquivalent(user) ? 'Operations · QR' : 'QR'}
        title="Your officer ID"
        lead="Show this at a meeting or forum you’re conducting. Another officer scans it from the Scan console’s officer ID check to confirm who you are — no event needed."
      />

      <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-10 lg:gap-14 mt-8 items-start">
        <div>
          {!user ? (
            <div className="mp-skeleton mx-auto w-full max-w-[340px] aspect-[336/520]" aria-busy="true" aria-label="Loading your ID" />
          ) : card.isError ? (
            <div className="space-y-4">
              <p role="alert" className="mp-alert">{apiError(card.error, 'We couldn’t load your ID. Check your connection and try again.')}</p>
              <button type="button" onClick={() => card.refetch()} className="mp-btn mp-btn--primary">Try again</button>
            </div>
          ) : (
            <OfficerIdCard user={user} qrValue={card.data?.qrValue} />
          )}
        </div>

        <div className="space-y-8">
          <section aria-labelledby="officer-qr-tips" className="mp-card p-6">
            <h2 id="officer-qr-tips" className="mp-h3">At the meeting</h2>
            <ul className="mt-3 space-y-2 text-[0.9375rem] mp-muted list-disc pl-5">
              <li>Turn your screen brightness up so the scanner reads it first time.</li>
              <li>Every check is verified live and logged to the audit trail — it isn’t recorded as event attendance.</li>
              <li>If your position changes, this QR updates automatically — nothing to reissue.</li>
            </ul>
            <Link to="/admin/scan" className="mp-link inline-block mt-4 text-[0.875rem]">Open the scan console</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
