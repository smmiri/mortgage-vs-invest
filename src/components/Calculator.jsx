import { useEffect, useMemo, useState } from "react";
import { DEFAULT_INPUTS } from "../lib/defaults.js";
import {
  clearInputsCookie,
  loadInputsFromCookie,
  writeInputsToCookie,
} from "../lib/persist-inputs.js";
import { simulate } from "../lib/model.js";
import InputPanel from "./InputPanel.jsx";
import Summary, { PathTotals } from "./Summary.jsx";
import WealthChart from "./WealthChart.jsx";
import YearTable from "./YearTable.jsx";
import { CmhcInsuranceCallout } from "./AmortizationSelector.jsx";
import Warnings from "./Warnings.jsx";

const SAVE_DEBOUNCE_MS = 400;

function loadInitialInputs() {
  return loadInputsFromCookie() ?? DEFAULT_INPUTS;
}

export default function Calculator() {
  const [inputs, setInputs] = useState(loadInitialInputs);
  const results = useMemo(() => simulate(inputs), [inputs]);

  useEffect(() => {
    const id = window.setTimeout(() => writeInputsToCookie(inputs), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [inputs]);

  const handleReset = () => {
    clearInputsCookie();
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <section id="calculator" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <InputPanel inputs={inputs} results={results} onChange={setInputs} onReset={handleReset} />

      <div className="mt-10 space-y-6 border-t border-slate-200 pt-10">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Results</h2>
            <p className="text-sm text-slate-500">Updates live as you change inputs above.</p>
          </div>
        </header>

        <Warnings items={results.warnings} />
        <CmhcInsuranceCallout results={results} inputs={inputs} variant="compact" />
        <Summary results={results} />
        <WealthChart results={results} />
        <PathTotals results={results} />
        <YearTable results={results} />
      </div>
    </section>
  );
}
