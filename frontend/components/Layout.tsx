import { ReactNode } from 'react';

/**
 * Global layout for all pages.
 * Navigation menus and RMS alert indicators should be added here.
 *
 * Suggested structure:
 * const navigationItems = [
 *   { name: 'Dashboard', href: '/' },
 *   { name: 'RMS Alerts', href: '/rms-alerts', icon: '🚨' },
 *   { name: 'Analytics', href: '/analytics' },
 *   { name: 'Reports', href: '/reports' },
 *   { name: 'Settings', href: '/settings' }
 * ];
 *
 * A future enhancement could poll `/api/real-data` and display
 * an alert badge for critical metrics.
 */
type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <>
      <header>
        <h1>Pacific Sands Analytics</h1>
        {/* Navigation menu and alert badge will be rendered here */}
      </header>
      <main>{children}</main>
    </>
  );
}
