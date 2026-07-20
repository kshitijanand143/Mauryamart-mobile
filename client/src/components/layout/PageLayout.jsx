import React from 'react';
import Header from './Header';
import { Footer } from './BottomNav';
import { BottomNav } from './BottomNav';

export default function PageLayout({ children, noFooter = false, noPad = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${noPad ? '' : 'pb-20 sm:pb-0'}`}>
        {children}
      </main>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
