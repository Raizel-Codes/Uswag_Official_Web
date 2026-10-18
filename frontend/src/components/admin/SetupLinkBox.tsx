// A one-time "set your password" link, shown to the Super Admin to hand over in person (or send
// privately). It works once and expires; the server never shows it again, so this is the only copy.

import { useState } from 'react';

export default function SetupLinkBox({ url, minutes }: { url: string; minutes: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the field below is selectable
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor="setup-link" className="block text-[0.8125rem] font-semibold">Setup link</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="setup-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 min-h-[44px] rounded-[3px] border border-[rgb(20_39_24/0.25)] bg-[rgb(231_239_228/0.6)] px-3 text-[0.8125rem] font-mono"
        />
        <button type="button" onClick={copy} className="mp-btn mp-btn--ghost w-full sm:w-auto">{copied ? 'Copied' : 'Copy link'}</button>
      </div>
      <p className="mp-muted text-[0.8125rem]">
        Give this to them privately. They open it once to choose their own password, and it expires in {minutes} minutes. You can make a new one anytime until they’ve set it.
      </p>
    </div>
  );
}
