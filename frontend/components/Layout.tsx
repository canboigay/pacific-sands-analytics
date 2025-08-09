import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <>
      <header>
        <h1>Pacific Sands Analytics</h1>
      </header>
      <main>{children}</main>
    </>
  );
}
