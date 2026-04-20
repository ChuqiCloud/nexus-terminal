import type { ITheme } from 'xterm';

// 默认 xterm 主题
// (与 backend/src/config/default-themes.ts 中的定义保持一致)
export const defaultXtermTheme: ITheme = {
  background: '#111411',
  foreground: '#d8e6d2',
  cursor: '#8ff7a7',
  selectionBackground: '#21462b',
  black: '#111411',
  red: '#d96c5f',
  green: '#59d971',
  yellow: '#d8ba52',
  blue: '#4ca89f',
  magenta: '#6f8f8a',
  cyan: '#4ec9b0',
  white: '#d8e6d2',
  brightBlack: '#5d685b',
  brightRed: '#f07d6c',
  brightGreen: '#7df79b',
  brightYellow: '#ead17a',
  brightBlue: '#76d0c8',
  brightMagenta: '#92b8b2',
  brightCyan: '#7ae7d6',
  brightWhite: '#f3fff0'
};

// 默认 UI 主题 (CSS 变量) — NVIDIA Design System Dark
// (与 frontend/src/features/appearance/config/default-themes.ts 保持一致)
export const defaultUiTheme: Record<string, string> = {
  '--app-bg-color': '#000000',                         // True Black
  '--text-color': '#ffffff',                           // White on dark
  '--text-color-secondary': '#a7a7a7',                 // Gray 300
  '--text-color-tertiary': '#757575',                  // Gray 500
  '--border-color': '#5e5e5e',                         // Gray Border
  '--link-color': '#ffffff',                           // White links on dark
  '--link-hover-color': '#3860be',                     // Blue hover
  '--link-active-color': '#76b900',                    // NVIDIA Green
  '--link-active-bg-color': 'rgba(118, 185, 0, 0.12)',// Green 12%
  '--nav-item-active-bg-color': 'var(--link-active-bg-color)',
  '--header-bg-color': '#000000',
  '--footer-bg-color': '#000000',
  '--card-bg-color': '#1a1a1a',                        // Near Black cards
  '--button-bg-color': '#76b900',                      // NVIDIA Green CTA
  '--button-text-color': '#000000',                    // Black on green
  '--button-hover-bg-color': '#1eaedb',                // Teal hover
  '--button-secondary-bg-color': '#1a1a1a',
  '--icon-color': '#757575',
  '--icon-hover-color': '#76b900',
  '--split-line-color': '#5e5e5e',
  '--split-line-hover-color': '#76b900',
  '--input-focus-border-color': '#76b900',
  '--input-focus-glow': '#76b900',
  '--overlay-bg-color': 'rgba(0, 0, 0, 0.85)',
  '--color-success': '#3f8500',
  '--color-error': '#e52020',
  '--color-warning': '#ef9100',
  '--color-success-text': '#ffffff',
  '--color-error-text': '#ffffff',
  '--color-warning-text': '#1a1a1a',
  '--font-family-sans-serif': "Arial, Helvetica, sans-serif",
  '--base-padding': '1rem',
  '--base-margin': '0.5rem',
};
