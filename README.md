# Buy vs Rent & Invest

Open-source calculator that compares two long-running paths over the same time horizon:

1. **Buy** a home, pay down a Canadian-style mortgage, and either sell at the end (optional transaction costs) or keep the property.
2. **Rent** an equivalent home and invest the same upfront cash plus any monthly surplus at a market return.

**Live app:** [rentorbuy.smmiri.com](https://rentorbuy.smmiri.com/) (also [github.io mirror](https://smmiri.github.io/mortgage-vs-invest/))

The simulation is month-by-month, implemented as pure functions in `src/lib/`. The web UI is a thin layer on top. Core logic is in **`src/lib/model.js`** (wealth paths) and **`src/lib/closing-costs.js`** (Canadian cash-to-close).

---

## What is being compared?

Both paths are given the **same total cash at closing** (down payment + closing costs). The buyer puts the down payment into equity and pays closing costs to third parties. The renter invests that full amount in a portfolio at the chosen market return.

Each month, both paths are assumed to spend the same on housing:

```text
monthly_housing_budget = max(owning_cost, rent)
```

The cheaper side invests the difference at the market return (never negative). When owning is more expensive, the renter’s portfolio grows by `owning_cost − rent`. When renting is more expensive (e.g. after the mortgage is largely paid down), the buyer compounds `rent − owning_cost` in a side portfolio.

**Winner** at year *t* is whichever path has higher **net wealth** (buy line minus rent line). The chart marks the **crossover year** when those lines meet.

---

## Modeling assumptions

| Topic | Assumption |
|--------|------------|
| Geography | Canadian mortgage conventions by default (semi-annual compounding, CMHC tiers, provincial land transfer tax). Other jurisdictions can be approximated by editing inputs. |
| Growth rates | Property appreciation, rent increases, expense inflation, and market return are **constant** annual rates, compounded monthly where relevant. |
| Housing budget | **Symmetric** monthly cap: `max(owning_cost, rent)`; surplus invested by the cheaper side. |
| Ownership costs | Fixed monthly bundle (tax, insurance, condo/strata, maintenance), grown by expense inflation. Mortgage P&I from amortization schedule. |
| Down payment | User sets **% of price**; financed amount = price − down payment (+ CMHC premium if insured). |
| Amortization | **25 or 30 years**; 30-year insured mortgages add **+0.20%** to the CMHC premium rate. |
| Time horizon | User-chosen (1–40 years); independent of amortization length. |
| Sale at exit | Optional % haircut on property value (realtor, legal, discharge). Off = paper equity only. |
| Exit taxes (on by default) | **Annual** tax on portfolio gains (non-registered); **home sale tax at exit** only when selling, with full **principal residence exemption** by default. Chart and headline delta use after-tax wealth. |

---

## Exit taxes (simplified)

When **Exit taxes** is enabled (default):

**Portfolio (renter + buyer side portfolio), each year:**

```text
year_gain = max(0, end_value − start_value − contributions_that_year)
tax = year_gain × inclusion rate × marginal rate
```

Tax is paid from the portfolio at year-end (assumes gains are realized annually in a taxable account).

**Home (only if selling at exit):**

```text
gain = max(0, proceeds − purchase price)
taxable gain = gain × (1 − PRE exempt fraction)
tax = taxable gain × inclusion rate × marginal rate
```

Default **Principal residence** → no tax on the home. Partial / not exempt: as above.

No TFSA/FHSA room is modeled.

**If we added shelter room later:** inputs such as `tfsaRoomAvailable` / `fhsaRoomAvailable` could cap tax-free growth with `exemptGain = min(portfolioGain, room)` and tax only the remainder.

---

## Mortgage math (Canada)

Quoted nominal annual rate *r* compounds **semi-annually**. Effective monthly rate:

```text
r_m = (1 + r / 2)^(1/6) − 1
```

Payment on principal *P* (including CMHC rolled in) over *n* months:

```text
P · r_m · (1 + r_m)^n / ((1 + r_m)^n − 1)
```

### CMHC default insurance (down &lt; 20%)

| Down payment (% of price) | Premium rate on financed amount |
|---------------------------|----------------------------------|
| 15 – 19.99% | 2.8% |
| 10 – 14.99% | 3.1% |
| 5 – 9.99% | 4.0% |

Premium is **added to the mortgage principal**, not paid as cash at closing (PST on the premium may be cash in ON / QC / SK / MB). Amortization **&gt; 25 years** on an insured loan adds **+0.20%** to the premium rate.

Minimum down payment follows the usual Canadian sliding scale (5% on the first $500k, 10% on $500k–$1.5M, 20% above $1.5M). Properties above **$1.5M** are treated as non-insurable (20% down required; no CMHC in the model).

---

## Cash to close (province-aware)

Closing costs are computed from **province**, **first-time buyer** status, and whether the home is **new construction**.

**Land transfer tax (LTT / PTT):** bracket schedules for BC, ON (+ optional Toronto MLTT), QC (+ optional Montréal surtax), MB, and flat or negligible rates elsewhere. Rebates/exemptions modeled where common:

- BC first-time buyer exemption (full ≤ $835k, partial to $860k); newly built exemption (full ≤ $1.1M, partial to $1.15M).
- Ontario $4,000 rebate; Toronto MLTT $4,475 rebate.
- PEI full exemption for FTB on resale ≤ $200k.

**GST / HST on new construction:** resale is exempt. New builds: federal GST 5% with standard new-housing rebate (CRA RC4028) and **2025 first-time buyer GST rebate** (full refund on homes ≤ $1M, phased to $1.5M). Provincial HST portion rebates where applicable (e.g. Ontario cap $24k on the provincial share).

**Other cash at closing:** user-editable legal / title / inspection (default ~$2,500).

The renter is modeled as having invested **down payment + total closing costs** at year 0. The buyer’s chart line is rebased to **down payment only** at year 0, so the visible gap between the two lines at *t = 0* equals closing costs.

---

## Wealth paths

**Renter** at month *m*:

```text
portfolio_m = portfolio_{m−1} · (1 + r_market/12) + top_up_m
top_up_m = max(0, max(own_cost_m, rent_m) − rent_m)
```

**Buyer** liquid value if sold:

```text
liquid_m = property_m · (1 − sale_cost%) − mortgage_balance_m
```

**Buyer** wealth on the chart (rebased at year 0):

```text
buy_wealth_m = down_payment + (liquid_m − liquid_0) + buyer_side_portfolio_m
```

`buyer_side_portfolio` grows when `rent_m > own_cost_m` at the same monthly housing budget.

---

## What is not modeled

- Annual tax drag on rent or dividends; RRSP/FHSA withdrawals; CRA +1 PRE year rule; change-in-use when renting the home.
- Mortgage **refinancing** or **renewal** at a different rate mid-amortization.
- Major one-off capital repairs beyond the monthly maintenance input.
- Renter’s insurance, deposits, or moving costs.
- Statutory rent-control caps (set your own rent-increase %).

Tax and closing-cost rules change with budgets and indexing; figures are **estimates** for sensitivity analysis, not filings.

---

## Using this repository

- **Use the app:** open [rentorbuy.smmiri.com](https://rentorbuy.smmiri.com/) and adjust inputs; methodology and a worked example are in the app.
- **Fork or clone:** MIT license. The model is dependency-free in `src/lib/`; import `simulate()` from `src/lib/model.js` in your own tooling or tests (`npm test` runs `node --test` on the lib tests).
- **Issues and PRs:** welcome; keep changes to the model tested and document new inputs in `FIELD_META` and the in-app methodology section.

---

## Disclaimer

**Not financial advice.** Simplified educational model, not a substitute for a mortgage broker, accountant, or lawyer. Treat outputs as **directional**; use as a **sensitivity tool**, not a recommendation to buy or rent.

## License

MIT. See [LICENSE](./LICENSE).
