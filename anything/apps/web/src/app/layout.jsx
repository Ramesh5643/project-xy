"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Task 2A: GTM container ID injected via env variable.
// Set NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX in your environment.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&display=swap"
          rel="stylesheet"
        />

        {/* GTM */}
        {GTM_ID && (
          <>
            <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`}</script>
            <script
              async
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            />
          </>
        )}

        <style>{`
          /* ═══════════════════════════════════════════════════════
             GLOBAL DESIGN TOKENS — themeable, conversion-first
             ═══════════════════════════════════════════════════════ */
          :root {
            --color-bg: #FAF9F7;
            --color-surface: #FFFFFF;
            --color-text-primary: #1A1A2E;
            --color-accent-primary: #2C3E6B;
            --color-accent-cta: #E8542A;
            --color-success: #2D7A5F;
            --color-warning: #C9952F;
            --color-danger: #C44545;
            --color-info: #2E6DA4;
            --color-scarcity: #C44545;
            --color-border: rgba(26, 26, 46, 0.08);
            --color-text-secondary: #5B6474;
            --color-text-muted: #76808F;

            --accent: var(--color-accent-primary);
            --accent-hover: #23345A;
            --accent-fg: #ffffff;
            --accent-muted: rgba(44, 62, 107, 0.12);
            --accent-muted-fg: var(--color-accent-primary);
            --accent-warm: var(--color-accent-cta);
            --accent-warm-hover: #D04A24;
            --accent-warm-fg: #fff7ed;

            --c-primary: var(--color-text-primary);
            --c-primary-hover: #141425;
            --c-primary-fg: #ffffff;
            --c-accent: var(--color-accent-primary);
            --c-accent-hover: var(--accent-hover);
            --c-accent-fg: var(--accent-fg);
            --c-success: var(--color-success);
            --c-warning: var(--color-warning);
            --c-danger: var(--color-danger);

            --c-bg: var(--color-bg);
            --c-surface: var(--color-surface);
            --c-surface-2: #F6F2EA;
            --c-border: var(--color-border);
            --c-border-subtle: rgba(26, 26, 46, 0.05);

            --c-text: var(--color-text-primary);
            --c-text-2: var(--color-text-secondary);
            --c-text-muted: var(--color-text-muted);
            --c-text-faint: #94a3b8;

            --font-heading: 'Inter', system-ui, sans-serif;
            --font-body: 'Inter', system-ui, sans-serif;
            --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

            --radius-sm: 6px;
            --radius-base: 10px;
            --radius-lg: 14px;
            --radius-xl: 18px;
            --radius-2xl: 24px;
            --radius-full: 9999px;

            --shadow-xs: 0 1px 2px rgb(15 23 42 / 0.04);
            --shadow-sm: 0 10px 30px rgb(15 23 42 / 0.06);
            --shadow-md: 0 20px 45px rgb(15 23 42 / 0.08);
            --shadow-lg: 0 24px 60px rgb(15 23 42 / 0.10);
            --shadow-xl: 0 30px 80px rgb(15 23 42 / 0.12);

            --t-fast: 120ms ease;
            --t-base: 180ms ease;
            --t-slow: 260ms ease;
          }

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: var(--font-body);
            font-size: 14px;
            line-height: 1.6;
            background: var(--color-bg);
            color: var(--color-text-primary);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
            font-weight: 700;
            letter-spacing: -0.025em;
            line-height: 1.2;
            color: var(--c-text);
          }

          a { color: inherit; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.65); border-radius: 99px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.9); }

          input, textarea, select, button { font-family: inherit; font-size: inherit; }
          button { cursor: pointer; }

          .card {
            background: var(--c-surface);
            border: 1px solid var(--c-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xs);
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.65);
            box-shadow: var(--shadow-sm);
          }
          .btn-accent {
            background: var(--color-accent-cta);
            color: var(--accent-fg);
            border: none;
            border-radius: var(--radius-base);
            font-weight: 600;
            transition: background var(--t-base), transform var(--t-fast), box-shadow var(--t-base);
            box-shadow: 0 10px 24px rgb(37 99 235 / 0.16);
          }
          .btn-accent:hover { background: var(--color-accent-primary); transform: translateY(-1px); }
          .btn-accent:active { transform: translateY(0); }
          .btn-action {
            background: var(--color-accent-cta);
            color: var(--accent-warm-fg);
            border: none;
            border-radius: var(--radius-base);
            font-weight: 700;
            transition: transform var(--t-fast), background var(--t-base);
            box-shadow: 0 10px 24px rgb(249 115 22 / 0.16);
          }
          .btn-action:hover { background: var(--accent-warm-hover); transform: translateY(-1px); }
          .btn-action:active { transform: translateY(0); }

          @keyframes shimmer {
            0%   { background-position: -200% 0; }
            100% { background-position:  200% 0; }
          }
          .skeleton {
            background: linear-gradient(90deg, #f4efe5 25%, #ece5d9 50%, #f4efe5 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
            border-radius: var(--radius-base);
          }

          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

          .animate-fade-in { animation: fadeIn 0.25s ease-out both; }
          .animate-spin { animation: spin 0.75s linear infinite; }
          .animate-pulse { animation: pulse 1.8s ease-in-out infinite; }
        `}</style>
      </head>
      <body>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
