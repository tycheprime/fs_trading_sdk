import type { FSThemeInput } from '@functionspace/react';

// Custom dark "trading terminal" theme built from the 9 required SDK tokens.
// Bitcoin orange as the primary, a cool blue as the agent/signal accent.
export const agentTheme: FSThemeInput = {
  primary: '#f7931a',
  accent: '#4d9fff',
  positive: '#3fb950',
  negative: '#f85149',
  background: '#080a0e',
  surface: '#11161f',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  border: '#222b38',
};

// Monospace stack for the terminal feel, used by the custom agent UI.
export const MONO =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, monospace";
