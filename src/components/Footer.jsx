import { RULES_AS_OF } from "../lib/site-meta.js";

export default function Footer({ repoUrl }) {
  return (
    <footer className="border-t border-default bg-surface-card">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-xs text-muted sm:px-6">
        <p className="max-w-3xl leading-relaxed">
          <strong className="font-semibold text-label">Not financial advice.</strong> Simplified month-by-month
          model for Canadian buyers: includes CMHC insurance, province-aware land transfer tax, GST/HST on new
          builds, optional sale costs, and simplified exit capital gains (PRE on home; taxable portfolio).
          Excludes annual tax drag, TFSA/FHSA room, RRSP, refinancing/renewal risk, large one-off repairs,
          and moving or renter&apos;s insurance. Assumes constant growth rates. Use as a sensitivity tool, not a
          recommendation.
        </p>

        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1 text-label">
          <a href="#privacy" className="hover:text-heading">
            Privacy
          </a>
          <a href="#terms" className="hover:text-heading">
            Terms
          </a>
          {repoUrl ? (
            <a href={repoUrl} className="hover:text-heading" target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          ) : null}
          <span aria-hidden>·</span>
          <span>MIT licensed</span>
        </nav>

        <section id="privacy" className="max-w-3xl scroll-mt-20 space-y-2 leading-relaxed">
          <h2 className="text-sm font-semibold text-heading">Privacy</h2>
          <p>
            This calculator runs entirely in your browser. Your inputs are not sent to a server. The only data
            stored locally is a first-party cookie named <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">rvb_inputs</code>{" "}
            (calculator assumptions, up to one year) so settings persist when you return. Use <strong>Reset to defaults</strong>{" "}
            in the calculator to clear it. No analytics or advertising trackers are used.
          </p>
          <p>
            Fonts are self-hosted in the app bundle (no third-party font requests). If you contact the author via
            GitHub, that is governed by GitHub&apos;s privacy policy, not this site.
          </p>
        </section>

        <section id="terms" className="max-w-3xl scroll-mt-20 space-y-2 leading-relaxed">
          <h2 className="text-sm font-semibold text-heading">Terms</h2>
          <p>
            The site and model are provided <strong className="font-medium text-label">as is</strong>, without warranty.
            Results are estimates for educational comparison only, not tax filings, mortgage approvals, or investment
            advice. Tax and closing-cost rules in the model were last reviewed for{" "}
            <strong className="font-medium text-label">{RULES_AS_OF}</strong>; provincial and federal programs change.
            Confirm figures with a mortgage broker, accountant, or lawyer before making decisions.
          </p>
          <p>
            To the fullest extent permitted by law, the authors are not liable for any loss arising from use of this
            tool. The open-source software is licensed under MIT (see repository).
          </p>
        </section>

        <p className="text-[11px] text-caption">
          Tax &amp; closing-cost model last reviewed: {RULES_AS_OF}. Calculator cookie:{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">rvb_inputs</code>, 365 days, SameSite=Lax.
        </p>
      </div>
    </footer>
  );
}
