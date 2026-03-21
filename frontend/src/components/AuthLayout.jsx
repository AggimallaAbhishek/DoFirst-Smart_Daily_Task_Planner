import { Link } from 'react-router-dom';

export default function AuthLayout({
  eyebrow,
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkTo,
  children
}) {
  return (
    <div className="auth-page">
      <nav className="planner-nav auth-nav">
        <a href="/" className="nav-logo">
          DoFirst<span>.</span>
        </a>
      </nav>
      <div className="auth-grid">
        <section className="auth-hero">
          <div>
            <span className="hero-eyebrow auth-eyebrow">
                {eyebrow}
            </span>
            <h1 className="hero-headline auth-headline">
              <span className="line">
                <span>The clearest part</span>
              </span>
              <span className="line">
                <span>
                  of your day <em className="accent-italic">starts</em>
                </span>
              </span>
              <span className="line">
                <span>right here.</span>
              </span>
            </h1>
            <p className="hero-desc auth-desc">{description}</p>
          </div>

          <div className="auth-cards">
            {[
              'Limit the plan to five tasks.',
              'Surface the top priority instantly.',
              'Track progress without clutter.'
            ].map((item) => (
              <div key={item} className="auth-chip">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="auth-form-panel panel">
          <div className="auth-form-header">
            <p className="section-label">{title}</p>
            <p className="panel-copy">{description}</p>
          </div>

          {children}

          <p className="auth-footer-link">
            {footerText}{' '}
            <Link className="inline-link" to={footerLinkTo}>
              {footerLinkText}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
