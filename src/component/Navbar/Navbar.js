import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const links = [
  { to: '/', label: 'Blogok', end: true },
  { to: '/blogs/add', label: 'Új bejegyzés' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-current bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80 dark:bg-night/95 dark:supports-[backdrop-filter]:bg-night/80">
      <div className="container-wide flex items-center justify-between h-16 md:h-20">
        <Link
          to="/"
          className="font-display font-bold text-2xl md:text-3xl tracking-tight title-link"
          aria-label="Főoldal"
        >
          WRITEUP<span className="text-accent dark:text-accent-dark">.</span>
        </Link>

        <nav aria-label="Fő navigáció" className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `font-display uppercase text-sm tracking-wider transition-colors ${
                  isActive ? 'text-accent dark:text-accent-dark' : 'hover:text-accent dark:hover:text-accent-dark'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="btn-brutal btn-brutal--icon"
            aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobil navigáció"
          className="md:hidden border-t-2 border-current bg-paper dark:bg-night"
        >
          <ul className="container-wide py-4 flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block py-3 font-display uppercase text-base tracking-wider border-b-2 border-current/10 ${
                      isActive ? 'text-accent dark:text-accent-dark' : ''
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
