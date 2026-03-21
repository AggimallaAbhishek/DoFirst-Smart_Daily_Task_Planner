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
    <div className="min-h-screen bg-planner-texture px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/60 bg-ink p-8 text-parchment shadow-card sm:p-10 lg:p-12">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-5 animate-rise">
              <span className="inline-flex rounded-full border border-parchment/20 px-4 py-1 font-display text-xs uppercase tracking-[0.35em] text-parchment/70">
                {eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-xl font-display text-5xl font-semibold leading-tight sm:text-6xl">
                  The clearest part of your day starts here.
                </h1>
                <p className="max-w-lg font-body text-lg text-parchment/75">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                'Limit the plan to five tasks.',
                'Surface the top priority instantly.',
                'Track progress without clutter.'
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-parchment/10 bg-white/5 p-4 font-body text-sm text-parchment/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-card backdrop-blur sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-ember">
                {title}
              </p>
              <p className="font-body text-base text-ink/70">{description}</p>
            </div>

            {children}

            <p className="font-body text-sm text-ink/65">
              {footerText}{' '}
              <Link className="font-semibold text-slate underline-offset-4 hover:underline" to={footerLinkTo}>
                {footerLinkText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
