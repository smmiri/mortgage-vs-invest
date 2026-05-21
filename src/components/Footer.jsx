export default function Footer({ repoUrl }) {
  return (
    <footer className="border-t border-default bg-surface-card">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            <strong className="font-semibold text-label">Not financial advice.</strong> Simplified month-by-month
            model for Canadian buyers: includes CMHC insurance, province-aware land transfer tax, GST/HST on new
            builds, optional sale costs, and simplified exit capital gains (PRE on home; taxable portfolio).
            Excludes annual tax drag, TFSA/FHSA room, RRSP, refinancing/renewal risk, large one-off repairs,
            and moving or renter&apos;s insurance. Assumes constant growth rates. Use as a sensitivity tool, not a
            recommendation. Calculator assumptions are stored in a first-party browser cookie on this
            device so they persist when you return; use Reset to defaults to clear them.
          </p>
          <div className="flex items-center gap-3">
            <span>MIT licensed</span>
            <span aria-hidden>·</span>
            {repoUrl ? (
              <a href={repoUrl} className="hover:text-heading" target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
