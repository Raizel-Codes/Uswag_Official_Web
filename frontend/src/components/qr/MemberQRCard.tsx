import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface MemberQRCardProps {
  qrValue: string;
  name: string;
  serialNumber: string;
  collegeOrDept: string;
}

// Digital membership ID — see prototype/member.html "My Membership" page
// for the exact visual reference (gradient card, status pill, serial footer).
export default function MemberQRCard({ qrValue, name, serialNumber, collegeOrDept }: MemberQRCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrValue, {
        width: 220,
        margin: 1,
        color: { dark: '#142718', light: '#ffffff' },
      });
    }
  }, [qrValue]);

  return (
    <div className="bg-gradient-to-br from-forest to-primary rounded-3xl p-6 text-white">
      <div className="text-xs font-bold uppercase tracking-wide text-sage mb-4">USWAG</div>
      <div className="bg-white rounded-2xl p-4 flex justify-center mb-4">
        <canvas ref={canvasRef} />
      </div>
      <div className="font-heading font-bold">{name}</div>
      <div className="text-xs text-white/70">{collegeOrDept}</div>
      <div className="text-[10px] text-white/50 mt-2 font-mono">SERIAL · {serialNumber}</div>
    </div>
  );
}
