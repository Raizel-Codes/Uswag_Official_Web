import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** When this changes the boundary clears, so moving to another page recovers from a broken one. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

// A page that was open during a deploy asks for a chunk that no longer exists.
const STALE_BUILD = /dynamically imported module|Loading chunk|Importing a module script failed/i;

/**
 * Without this, any error thrown while rendering (or while a component unmounts) removes the whole
 * app and leaves a blank white page with no way back. This keeps the failure to a message and a
 * reload button, and says plainly when the cause is a newer version having been published.
 */
class Boundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = STALE_BUILD.test(String(error?.message ?? error));
    return (
      <main role="alert" className="min-h-screen bg-mist text-forest flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            {stale ? 'A newer version of USWAG is ready.' : 'Something went wrong on this page.'}
          </h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-forest/80">
            {stale
              ? 'Reload to get it. Nothing you’ve done is lost.'
              : 'Your account and records are fine. Reloading usually fixes it. If it keeps happening, tell us what you were doing.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-sm bg-primary px-5 py-2.5 font-semibold text-mist hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Reload the page
            </button>
            <a
              href="/"
              className="rounded-sm border border-forest/30 px-5 py-2.5 font-semibold text-forest hover:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Back to home
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}
