export default function Hero() {
  return (
    <section id="top" className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Open-source · Made for Canadian mortgages</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Should you buy or rent &amp; invest?
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          A transparent, month-by-month model. Compares the wealth of buying a home — and either selling or keeping
          it — against renting the same property and investing the difference. CMHC, semi-annual compounding,
          closing costs, and rent inflation are all built in.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge>Canadian semi-annual compounding</Badge>
          <Badge>Cash-to-close included</Badge>
          <Badge>Optional sale costs</Badge>
          <Badge>Editable assumptions</Badge>
        </div>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}
