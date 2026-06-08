import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Space-themed portfolio with interactive 3D launch hero." />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:title" content="Space Portfolio" />
        <meta property="og:description" content="Launch into a space-themed portfolio with an interactive astronaut hero scene." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
