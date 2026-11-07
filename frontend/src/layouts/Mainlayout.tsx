import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// The frame around every page after login: menu on the side, page content in the middle.
export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false); // phone menu open or closed

  return (
    <div className="shell">
      {/* Top bar: only visible on phones */}
      <header className="topbar">
        <button className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>☰</button>
        <strong>🌸 Meetly</strong>
      </header>

      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="content">
        {/* <Outlet /> is where the current page appears */}
        <Outlet />
      </main>
    </div>
  );
}