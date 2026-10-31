import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { resolveTheme } from '@/lib/palettes';

// The site is always light (ivory). Body text everywhere is Manrope; text marked data-font="heading" (the H component) is Playfair Display.
const fontCss = `html, body { background-color: ${resolveTheme().colors.bg}; color-scheme: light; }
body [dir="auto"], body input, body textarea { font-family: Manrope, 'Noto Sans Telugu', system-ui, -apple-system, 'Segoe UI', sans-serif; }
body [data-font="heading"] { font-family: 'Playfair Display', Georgia, 'Noto Sans Telugu', serif; letter-spacing: 0; }`;

/** HTML wrapper for every page of the website (web only; runs in Node during export). */
export default function Root({ children }: PropsWithChildren) {
  // SDK 58+: the generated styles (headNodes) and the app's JavaScript (bodyNodes) must be placed here.
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="color-scheme" content="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Sai Venkateshwara Industries (సాయి వెంకటేశ్వర ఇండస్ట్రీస్) — fresh murmura (puffed rice). Order online, track deliveries and download bills." />
        <ScrollViewStyleReset />
        {/* Brand fonts: Manrope for text, Playfair Display for headings, Noto Sans Telugu for Telugu letters. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: fontCss }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
