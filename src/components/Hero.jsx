export default function Hero() {
  return (
    <section id="top" className="hero-gradient">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Open-source · Built for Canadian mortgages
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Should you buy or rent &amp; invest?
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          I kept asking the same question: what if I rented instead of buying, invested the same cash up front (down
          payment plus closing costs), and kept topping up the portfolio whenever owning would have cost more? I built
          this calculator to run that comparison year by year. Each month it updates the mortgage, rent, ownership
          costs, and both portfolios, then shows who ends up ahead. CMHC, closing costs, rent inflation, and Canadian
          mortgage math are all built in.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          <span className="font-medium text-label">What&apos;s in the model:</span> semi-annual mortgage rates,
          province-level cash to close, optional sale costs at the end, and sliders for rent, growth, taxes, and the
          rest so you can stress-test your own assumptions.
        </p>
      </div>
    </section>
  );
}
