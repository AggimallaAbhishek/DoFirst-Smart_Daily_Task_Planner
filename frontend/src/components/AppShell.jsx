import { useEffect } from 'react';
import { formatTodayLabel } from '../lib/formatters';

export default function AppShell({ user, onLogout, children }) {
  useEffect(() => {
    const nav = document.getElementById('nav');

    if (!nav) {
      return undefined;
    }

    const handleScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="planner-page">
      <nav className="planner-nav" id="nav">
        <a href="#hero" className="nav-logo">
          DoFirst<span>.</span>
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
        <button type="button" className="nav-cta interactive" onClick={onLogout}>
          Logout
        </button>
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
