import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion } from '@/lib/motion';
import MembershipEnvelope from './MembershipEnvelope';
import MailDoor from './MailDoor';

ensureGsapRegistered();

export type DropboxPhase = 'sealing' | 'posting' | 'closed';

interface ApplicationDropboxProps {
  /**
   * sealing: the open envelope closes and the wax seal is pressed (while the request is in flight)
   * posting: the server accepted it — the door appears, opens, takes the envelope and shuts
   * closed:  final state (also the state shown when revisiting /apply from the same device)
   */
  phase: DropboxPhase;
  /** Called once the posting sequence has finished (immediately under reduced motion). */
  onPosted?: () => void;
  /** Engraved plate shown under the shut door in the closed phase. */
  plate?: ReactNode;
}

/**
 * The submission ceremony for ApplicationPage. Decorative only: the page itself announces
 * each step in a live region and moves focus to the result, and the door only opens after
 * the server has confirmed the application — a failed request never "goes through".
 */
export default function ApplicationDropbox({ phase, onPosted, plate }: ApplicationDropboxProps) {
  const root = useRef<HTMLDivElement>(null);
  const doorWrap = useRef<HTMLDivElement>(null);
  const door = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  // The envelope arrives open (as the applicant left it), then closes on the next frame.
  const [envelopeOpen, setEnvelopeOpen] = useState(phase === 'sealing');
  const onPostedRef = useRef(onPosted);
  onPostedRef.current = onPosted;

  useEffect(() => {
    if (phase !== 'sealing') return;
    const t = setTimeout(() => setEnvelopeOpen(false), prefersReducedMotion() ? 0 : 80);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'posting' && prefersReducedMotion()) onPostedRef.current?.();
  }, [phase]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduced = prefersReducedMotion();

      if (phase === 'sealing') {
        // Door waits out of sight; bolt drawn back; wax pressed after the flap has shut.
        gsap.set(doorWrap.current, { autoAlpha: 0, y: 28 });
        gsap.set(q('.lp-door__bolt'), { xPercent: 90 });
        if (!reduced) {
          gsap.fromTo(
            q('.lp-envelope__wax'),
            { scale: 1.9, autoAlpha: 0, rotate: -20 },
            { scale: 1, autoAlpha: 1, rotate: 0, duration: 0.45, ease: 'back.out(2.4)', delay: 0.75 }
          );
        }
        return;
      }

      if (phase !== 'posting' || reduced || !door.current || !slot.current) return;

      const leaf = q('.lp-door__leaf');
      const mouth = q('.lp-door__mouth')[0];
      const bolt = q('.lp-door__bolt');

      const tl = gsap.timeline({ onComplete: () => onPostedRef.current?.() });
      tl.to(doorWrap.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
        .to(leaf, { rotateY: -112, duration: 0.8, ease: 'power2.inOut' }, '+=0.05')
        // Measured when this step starts, so it's correct at any viewport width.
        .add(() => {
          const env = slot.current!.getBoundingClientRect();
          const m = mouth.getBoundingClientRect();
          const scale = (m.width * 0.78) / env.width;
          gsap
            .timeline()
            .to(slot.current, {
              x: m.left + m.width / 2 - (env.left + env.width / 2),
              y: m.top + m.height * 0.58 - (env.top + env.height / 2),
              scale,
              duration: 0.95,
              ease: 'power2.in',
            })
            // Explicit start: tweening from `filter: none` starts at brightness(0) (a black flash).
            .fromTo(
              slot.current,
              { filter: 'brightness(1)' },
              { autoAlpha: 0, filter: 'brightness(0.3)', duration: 0.3, ease: 'power1.in', immediateRender: false },
              '-=0.28'
            );
        }, '-=0.3')
        .to(leaf, { rotateY: 0, duration: 0.5, ease: 'power3.in' }, '+=1.05')
        .to(door.current, { x: 1.5, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' })
        .to(bolt, { xPercent: 0, duration: 0.28, ease: 'power2.out' }, '+=0.08');
    },
    { scope: root, dependencies: [phase] }
  );

  return (
    <div ref={root} className="lp-dropbox" data-phase={phase} aria-hidden="true">
      <div ref={doorWrap} className="lp-dropbox__door">
        <MailDoor ref={door} />
      </div>

      {phase !== 'closed' && (
        <div ref={slot} className="lp-dropbox__slot">
          <MembershipEnvelope opened={envelopeOpen} sealed dropIn={false} />
        </div>
      )}

      {phase === 'closed' && plate && <div className="lp-dropbox__plate">{plate}</div>}
    </div>
  );
}
