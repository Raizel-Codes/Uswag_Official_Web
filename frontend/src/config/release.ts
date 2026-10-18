// Which stage this build is. Set VITE_RELEASE_STAGE=beta on the host (Vercel) while the site is in its
// testing phase; leave it unset, or set it to anything else, for the official release. Switching stages
// is a setting change and a redeploy, not a code change: the beta notice (BetaBanner) and the footer
// note render only when this is true.
export const IS_BETA = import.meta.env.VITE_RELEASE_STAGE === 'beta';
