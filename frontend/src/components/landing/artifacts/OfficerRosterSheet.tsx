import { Fragment } from 'react';
import { deckleClipPath } from './deckle';
import EngravedCrest from './EngravedCrest';
import RubberStamp from '../ornaments/RubberStamp';
import type { RosterBatch } from '../firstOfficers.data';

interface OfficerRosterSheetProps {
  batch: RosterBatch;
  /** Screen-reader caption noun, e.g. "founding officers". */
  captionLabel: string;
  /** Badge shown while any name is still unconfirmed. */
  pendingNote: string;
  /** Seeds the torn-edge shape so two sheets on one page don't look cut from the same sheet. */
  edgeSeed: number;
  tilt?: number;
}

/**
 * A batch of officers as a typed roster sheet. Unlike the decorative clippings this is real
 * content, so it is readable HTML (a <table>), not aria-hidden. Unconfirmed names show as a
 * ruled blank with "To be confirmed"; rows sharing a `group` sit under one sub-heading.
 */
export default function OfficerRosterSheet({ batch, captionLabel, pendingNote, edgeSeed, tilt = -7 }: OfficerRosterSheetProps) {
  const { termLabel, officers, stamp } = batch;
  const pending = officers.some((o) => !o.name);
  const clip = deckleClipPath(edgeSeed, 0.8, 30);

  return (
    <div className="lp-paper-shadow">
      <div className="lp-paper px-5 py-8 sm:px-10 sm:py-10" style={{ clipPath: clip }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lp-masthead" style={{ fontSize: '0.875rem' }}>USWAG</p>
            <p className="lp-dateline lp-ink-secondary mt-1.5" style={{ fontSize: '1rem' }}>
              Roster of Officers · <span className="lp-onum">{termLabel}</span>
            </p>
          </div>
          <EngravedCrest size={56} className="shrink-0" />
        </div>
        <div className="lp-clipping__rule mt-5 mb-2" />

        <table className="w-full text-left">
          <caption className="lp-sr-only">
            USWAG {captionLabel}, {termLabel}
            {pending ? ' — some names pending confirmation' : ''}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="lp-eyebrow lp-ink-secondary py-3 pr-4 font-semibold">Position</th>
              <th scope="col" className="lp-eyebrow lp-ink-secondary py-3 font-semibold">Name</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((o, i) => (
              <Fragment key={o.position}>
                {o.group && o.group !== officers[i - 1]?.group && (
                  <tr className="border-t border-dotted" style={{ borderColor: 'rgb(122 98 66 / 0.45)' }}>
                    <th scope="colgroup" colSpan={2} className="lp-eyebrow lp-ink-secondary pt-6 pb-2 text-left font-semibold">
                      {o.group}
                    </th>
                  </tr>
                )}
                <tr className="border-t border-dotted" style={{ borderColor: 'rgb(122 98 66 / 0.45)' }}>
                  <th scope="row" className="font-display font-semibold text-[1rem] py-3.5 pr-4 align-top w-[46%] sm:w-auto sm:whitespace-nowrap">
                    {o.position}
                  </th>
                  <td className="py-3.5 align-top">
                    {o.name ? (
                      <span className="font-display text-[1.0625rem]">
                        {o.name}
                        {o.collegeOrDept && <span className="lp-ink-secondary lp-small block">{o.collegeOrDept}</span>}
                      </span>
                    ) : (
                      <span className="lp-dateline lp-ink-secondary" style={{ fontSize: '0.9375rem' }}>
                        To be confirmed
                      </span>
                    )}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-end justify-between gap-6 mt-8">
          {pending ? <p className="lp-badge-pending">{pendingNote}</p> : <span />}
          <RubberStamp ring="UNITED STUDENTS · NWSSU · " center={stamp.center} sub={stamp.sub} size={104} tilt={tilt} />
        </div>
      </div>
    </div>
  );
}
