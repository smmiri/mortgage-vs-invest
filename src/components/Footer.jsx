export default function Footer({ repoUrl }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            <strong className="font-semibold text-slate-700">Not financial advice.</strong> Simplified month-by-month
            model for Canadian buyers: includes CMHC insurance, province-aware land transfer tax, GST/HST on new
            builds, optional sale costs, and simplified exit capital gains (PRE on home; taxable portfolio).
            Excludes annual tax drag, TFSA/FHSA room, RRSP, refinancing/renewal risk, large one-off repairs,
            and moving or renter&apos;s insurance. Assumes constant growth rates. Use as a sensitivity tool, not a
            recommendation.
          </p>
          <div className="flex items-center gap-3">
            <span>MIT licensed</span>
            <span aria-hidden>·</span>
            {repoUrl ? (
              <a href={repoUrl} className="hover:text-slate-900" target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
