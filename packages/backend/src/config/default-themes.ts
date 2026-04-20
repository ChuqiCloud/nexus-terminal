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

// 默认 UI 主题 (CSS 变量) — Apple Design System Light
// (与 frontend/src/features/appearance/config/default-themes.ts 保持一致)
export const defaultUiTheme: Record<string, string> = {
  '--app-bg-color': '#f5f5f7',                         // Apple Light Gray
  '--text-color': '#1d1d1f',                            // Near Black
  '--text-color-secondary': 'rgba(0, 0, 0, 0.8)',      // Black 80%
  '--text-color-tertiary': 'rgba(0, 0, 0, 0.48)',      // Black 48%
  '--border-color': 'rgba(0, 0, 0, 0.08)',             // Ultra-subtle border
  '--link-color': '#0066cc',                            // Link Blue
  '--link-hover-color': '#0071e3',                      // Apple Blue
  '--link-active-color': '#0071e3',                     // Apple Blue
  '--link-active-bg-color': 'rgba(0, 113, 227, 0.08)', // Blue 8%
  '--nav-item-active-bg-color': 'var(--link-active-bg-color)',
  '--header-bg-color': '#e8e8ed',
  '--footer-bg-color': '#f5f5f7',
  '--card-bg-color': '#ffffff',
  '--button-bg-color': '#0071e3',                       // Apple Blue CTA
  '--button-text-color': '#ffffff',
  '--button-hover-bg-color': '#0077ed',
  '--button-secondary-bg-color': '#e8e8ed',
  '--icon-color': 'rgba(0, 0, 0, 0.48)',
  '--icon-hover-color': '#0071e3',
  '--split-line-color': 'rgba(0, 0, 0, 0.08)',
  '--split-line-hover-color': 'rgba(0, 0, 0, 0.16)',
  '--input-focus-border-color': '#0071e3',
  '--input-focus-glow': '#0071e3',
  '--overlay-bg-color': 'rgba(0, 0, 0, 0.4)',
  '--color-success': '#30d158',
  '--color-error': '#ff453a',
  '--color-warning': '#ff9f0a',
  '--color-success-text': '#ffffff',
  '--color-error-text': '#ffffff',
  '--color-warning-text': '#1d1d1f',
  '--font-family-sans-serif': "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  '--base-padding': '1rem',
  '--base-margin': '0.5rem',
};
