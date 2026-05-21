import { useMemo, useState } from "react";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import { simulate } from "../lib/model.js";
import InputPanel from "./InputPanel.jsx";
import Summary, { PathTotals } from "./Summary.jsx";
import WealthChart from "./WealthChart.jsx";
import YearTable from "./YearTable.jsx";
import Warnings from "./Warnings.jsx";

export default function Calculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const results = useMemo(() => simulate(inputs), [inputs]);

  return (
    <section id="calculator" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-6">
          <InputPanel inputs={inputs} results={results} onChange={setInputs} />
          <ResetRow onReset={() => setInputs(DEFAULT_INPUTS)} />
        </div>

        <div className="space-y-6">
          <Warnings items={results.warnings} />
          <Summary results={results} />
          <WealthChart results={results} />
          <PathTotals results={results} />
          <YearTable results={results} />
        </div>
      </div>
    </section>
  );
}

function ResetRow({ onReset }) {
  return (
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        Reset to defaults
      </button>
    </div>
  );
}
