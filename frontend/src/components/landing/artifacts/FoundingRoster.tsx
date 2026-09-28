import { deckleClipPath } from './deckle';
import EngravedCrest from './EngravedCrest';
import RubberStamp from '../ornaments/RubberStamp';
import { FOUNDED_YEAR } from '../timeline.data';
import { FOUNDING_OFFICERS, FOUNDING_TERM_LABEL } from '../firstOfficers.data';

const CLIP = deckleClipPath(2011, 0.8, 30);

/**
 * The first batch of officers as a typed roster sheet from the founding year. Unlike the
 * decorative clippings this is real content, so it is readable HTML (a <table>), not aria-hidden.
 * Unconfirmed names show as a ruled blank with "To be confirmed".
 */
export default function FoundingRoster() {
  const pending = FOUNDING_OFFICERS.some((o) => !o.name);

  return (
    <div className="lp-paper-shadow">
      <div className="lp-paper px-5 py-8 sm:px-10 sm:py-10" style={{ clipPath: CLIP }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="lp-masthead" style={{ fontSize: '0.875rem' }}>USWAG</p>
            <p className="lp-dateline lp-ink-secondary mt-1.5" style={{ fontSize: '1rem' }}>
              Roster of Officers · <span className="lp-onum">{FOUNDING_TERM_LABEL}</span>
            </p>
          </div>
          <EngravedCrest size={56} className="shrink-0" />
        </div>
        <div className="lp-clipping__rule mt-5 mb-2" />

        <table className="w-full text-left">
          <caption className="lp-sr-only">
            USWAG founding officers, {FOUNDING_TERM_LABEL}
            {pending ? ' — names pending confirmation' : ''}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="lp-eyebrow lp-ink-secondary py-3 pr-4 font-semibold">Position</th>
              <th scope="col" className="lp-eyebrow lp-ink-secondary py-3 font-semibold">Name</th>
            </tr>
          </thead>
          <tbody>
            {FOUNDING_OFFICERS.map((o) => (
              <tr key={o.position} className="border-t border-dotted" style={{ borderColor: 'rgb(122 98 66 / 0.45)' }}>
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
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-end justify-between gap-6 mt-8">
          {pending ? (
            <p className="lp-badge-pending">Names pending confirmation with the USWAG adviser</p>
          ) : (
            <span />
          )}
          <RubberStamp ring="UNITED STUDENTS · NWSSU · " center="FIRST" sub={`BATCH ${FOUNDED_YEAR}`} size={104} tilt={-7} />
        </div>
      </div>
    </div>
  );
}
