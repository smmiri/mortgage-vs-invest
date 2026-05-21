/** Resolve closing-cost breakdown rows for display (i18n keys from model). */
export function describeBreakdownLine(line, tClosing, tProvinces) {
  const provinceName = (code) => (code ? tProvinces(code) : code);

  const label = tClosing(line.labelKey, {
    province: line.sublabelParams?.province || "",
    defaultValue: line.labelKey,
  });

  let sublabel = "";
  if (line.lineKeys?.length) {
    sublabel = line.lineKeys
      .map((key) => {
        const params = { province: provinceName(line.sublabelParams?.province) };
        if (key === "provincialNewHousing" && line.sublabelParams?.province) {
          return tClosing("lines.provincialNewHousing", params);
        }
        return tClosing(`lines.${key}`, params);
      })
      .join(" · ");
  } else if (line.sublabelKey) {
    const params = { ...line.sublabelParams };
    if (params.province) params.province = provinceName(params.province);
    sublabel = tClosing(line.sublabelKey, params);
  }

  return { label, sublabel };
}

export function describeDetailRows(detail, tClosing, formatCurrency) {
  if (!detail) return [];
  const rows = [];
  if (detail.federalGross != null && detail.federalGross > 0) {
    rows.push([tClosing("detail.federalGst"), detail.federalGross]);
    if (detail.federalRebate > 0) rows.push([tClosing("detail.federalRebate"), -detail.federalRebate]);
  }
  if (detail.provincialGross != null && detail.provincialGross > 0) {
    rows.push([tClosing("detail.provincialHst"), detail.provincialGross]);
    if (detail.provincialRebate > 0) rows.push([tClosing("detail.provincialRebate"), -detail.provincialRebate]);
  }
  if (detail.qstGross != null && detail.qstGross > 0) {
    rows.push([tClosing("detail.qcQst"), detail.qstGross]);
    if (detail.qstRebate > 0) rows.push([tClosing("detail.qstRebate"), -detail.qstRebate]);
  }
  if (detail.municipalGross != null && detail.municipalGross > 0) {
    rows.push([tClosing("detail.municipalLtt"), detail.municipalGross]);
    if (detail.municipalRebate > 0) rows.push([tClosing("detail.municipalFtb"), -detail.municipalRebate]);
  }
  return rows.map(([label, amount]) => ({ label, amount: formatCurrency(amount) }));
}
