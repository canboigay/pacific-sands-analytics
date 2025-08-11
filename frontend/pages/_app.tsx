import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../styles/globals.css';

/**
 * Wraps each page with the global Layout.
 * Navigation menus and RMS alert logic live in the Layout component.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
