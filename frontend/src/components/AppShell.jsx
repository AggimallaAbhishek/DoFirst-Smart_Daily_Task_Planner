import { useEffect, useState } from 'react';
import InstallAppButton from './InstallAppButton';
import { formatTodayLabel } from '../lib/formatters';

export default function AppShell({ user, onLogout, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const userLabel = user?.name || user?.email?.split('@')?.[0] || 'User';
  const avatarFallback = userLabel
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  useEffect(() => {
    let frameId = null;

    const updateScrollState = () => {
      frameId = null;
      const nextScrolled = window.scrollY > 80;
      setIsNavScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    };

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateScrollState);
    };

    handleScroll();
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="planner-page">
      <nav className={`planner-nav ${isNavScrolled ? 'scrolled' : ''}`} id="nav">
        <a href="#hero" className="nav-logo" onClick={closeMobileMenu}>
          <img
            src="/DoFirst.png"
            alt="DoFirst logo"
            className="nav-logo-image"
            width="34"
            height="34"
            decoding="async"
            loading="eager"
          />
          <span className="nav-logo-wordmark">
            DoFirst<span className="nav-logo-dot">.</span>
          </span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#suggestion">Focus</a>
          </li>
          <li>
            <a href="#progress">Progress</a>
          </li>
          <li>
            <a href="#form">Add Task</a>
          </li>
          <li>
            <a href="#tasks">Checklist</a>
          </li>
        </ul>
        <button
          type="button"
          className={`nav-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span className="nav-menu-line" />
          <span className="nav-menu-line" />
          <span className="nav-menu-line" />
          <span className="sr-only">Toggle menu</span>
        </button>
        <div className={`nav-right ${isMobileMenuOpen ? 'open' : ''}`} id="mobile-nav-panel">
          <div className="nav-mobile-links">
            <a href="#suggestion" onClick={closeMobileMenu}>Focus</a>
            <a href="#progress" onClick={closeMobileMenu}>Progress</a>
            <a href="#form" onClick={closeMobileMenu}>Add Task</a>
            <a href="#tasks" onClick={closeMobileMenu}>Checklist</a>
          </div>
          <InstallAppButton />
          <div className="nav-user-card">
            {user?.avatarUrl ? (
              <img
                className="nav-user-avatar"
                src={user.avatarUrl}
                alt={`${userLabel} avatar`}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="nav-user-avatar nav-user-avatar-fallback">{avatarFallback || 'U'}</div>
            )}
            <div className="nav-user-meta">
              <span className="nav-user-name">{userLabel}</span>
              <span className="nav-user-email">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="nav-cta interactive"
            onClick={() => {
              closeMobileMenu();
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="hero-eyebrow">Smart Daily Planner - Personal Productivity</div>
        <h1 className="hero-headline">
          <span className="line">
            <span>Focus the day</span>
          </span>
          <span className="line">
            <span>
              around the <em className="accent-italic">task</em>
            </span>
          </span>
          <span className="line">
            <span>that matters most.</span>
          </span>
        </h1>
        <div className="hero-sub">
          <div className="hero-copy-block">
            <p className="hero-anchor-copy">Focus the day around the task that matters most.</p>
            <p className="hero-desc">
            Plan up to five tasks, prioritize clearly, and follow the &quot;Do This First&quot; suggestion to keep
            momentum.
            </p>
          </div>
          <div className="hero-scroll">
            <div className="hero-scroll-line" />
            Scroll to manage today
          </div>
        </div>
        <div className="hero-counter">
          {formatTodayLabel()} - {user?.email}
        </div>
        <div className="hero-accent-bg" />
      </section>

      <div className="marquee-section">
        <div className="marquee-track">
          <span className="marquee-item">Set Priorities</span>
          <span className="marquee-item">Plan in Minutes</span>
          <span className="marquee-item">Track Daily Progress</span>
          <span className="marquee-item">Ship Real Work</span>
          <span className="marquee-item">Set Priorities</span>
          <span className="marquee-item">Plan in Minutes</span>
          <span className="marquee-item">Track Daily Progress</span>
          <span className="marquee-item">Ship Real Work</span>
        </div>
      </div>

      <main>{children}</main>

      <footer className="planner-footer">
        <div className="footer-left">
          DoFirst<span>.</span>
        </div>
        <div className="footer-copy">Your day, deliberately prioritized.</div>
        <div className="footer-socials">
          <a className="footer-social" href="#hero" title="Back to top">
            ↑
          </a>
          <a className="footer-social" href="#form" title="Add task">
            +
          </a>
          <a className="footer-social" href="#tasks" title="Checklist">
            ✓
          </a>
          <a className="footer-social" href="#progress" title="Progress">
            ◎
          </a>
        </div>
      </footer>
    </div>
  );
}
