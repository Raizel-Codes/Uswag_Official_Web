// USWAG currently ships a single fixed theme (see design tokens in
// styles/tokens.css). This context exists as a seam for a future
// dark-mode variant discussed in the project plan, not for arbitrary theming.
import { createContext, useContext, type ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light';
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
