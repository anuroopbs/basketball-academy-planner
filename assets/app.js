// =====================================================================
// Basketball Academy Planner: page logic.
// Content / reference data is in data.js.
// =====================================================================

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const $ = id => document.getElementById(id);
const fmtInt = v => Math.round(v).toLocaleString("en-IE");
const eur = v => (v < 0 ? "-" : "") + "€" + fmtInt(Math.abs(v));
function short(v) {
  const s = v < 0 ? "-" : "", a = Math.abs(v);
  if (a >= 1e6) return s + "€" + (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (a >= 1e4) return s + "€" + Math.round(a / 1e3) + "k";
  if (a >= 1e3) return s + "€" + (a / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return s + "€" + Math.round(a);
}
const pct = v => Math.round(v * 100) + "%";
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const sign = v => `<span class="${v >= 0 ? "pos" : "neg"}">${short(v)}</span>`;

function cardHtml(c) {
  return `<div class="card${c.hero ? " hero" : ""}${c.go ? " link" : ""}"${c.go ? ` data-go="${c.go}"` : ""}>
    <div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub || ""}</div></div>`;
}

const STORE_KEY = "bball-planner-v3";
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; } })();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ A, W, WHY, slide })); } catch {}
}

// ---------------------------------------------------------------------
// Tabs (URL hash, so every tab is linkable)
// ---------------------------------------------------------------------
const TABS = ["about", "calc", "deck", "why", "revenue", "funding", "cities", "params"];
let currentTab = "about";
function showTab(name) {
  if (!TABS.includes(name)) name = "about";
  currentTab = name;
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "p-" + name));
  if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) showTab(go.dataset.go);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

// =====================================================================
// CALCULATOR
// =====================================================================
const LEVERS_COURT = [
  { k: "n",         label: "Number of academies",               min: 1,  max: 10,  step: 1,  v: 1,   main: true },
  { k: "occ",       label: "Occupancy (court places filled)",   min: 10, max: 100, step: 5,  v: 70,  fmt: v => v + "%" },
  { k: "kidsFee",   label: "Price charged: kids monthly fee",   min: 20, max: 150, step: 5,  v: 70,  fmt: v => "€" + v },
  { k: "group",     label: "Kids per coach on one court",       min: 20, max: 40,  step: 1,  v: 30 },
  { k: "cac",       label: "Cost to acquire one student",       min: 0,  max: 200, step: 5,  v: 60,  fmt: v => "€" + v },
  { k: "campWeeks", label: "Holiday camp weeks per year",       min: 0,  max: 16,  step: 1,  v: 8 },
];
const LEVERS_OTHER = [
  { k: "gymArea",    label: "Fitness zone size",               min: 0,  max: 400,  step: 10, v: 200, fmt: v => v + " m²" },
  { k: "gymMembers", label: "Fitness zone members",            min: 0,  max: 300,  step: 5,  v: 80 },
  { k: "gymFee",     label: "Fitness membership monthly fee",  min: 30, max: 150,  step: 5,  v: 65,  fmt: v => "€" + v },
  { k: "adults",     label: "Adult basketball members",        min: 0,  max: 200,  step: 5,  v: 40 },
  { k: "pickup",     label: "Pickup-game visits per month",    min: 0,  max: 1000, step: 10, v: 250 },
  { k: "grantPct",   label: "Fit-out covered by grants",       min: 0,  max: 80,   step: 5,  v: 0,   fmt: v => v + "%" },
];
const LEVERS = [...LEVERS_COURT, ...LEVERS_OTHER];

const GROUPS = [
  { title: "Space & rent", fields: [
    ["courtArea",     "Basketball court footprint (m²)",   608],
    ["supportArea",   "Changing, reception, storage (m²)", 150],
    ["rentPerM2",     "Rent per m² per month (€)",           9],
    ["utilPerM2",     "Utilities per m² per month (€)",    2.5],
    ["depositMonths", "Rent deposit (months)",               3],
  ]},
  { title: "Court schedule & students", fields: [
    ["kidsSessions",  "Kids court sessions per week",       20],
    ["perKid",        "Sessions per kid per week",           2],
    ["churnPct",      "Students leaving per month (%)",      4],
  ]},
  { title: "One-time setup (€)", fields: [
    ["courtFitout",   "Court fit-out (floor, hoops, lights)", 120000],
    ["gymEquipPerM2", "Fitness equipment per m² of zone",     200],
    ["gymFloorPerM2", "Rubber gym flooring per m²",            45],
    ["supportFitout", "Changing rooms & reception fit-out", 40000],
    ["launch",        "Launch marketing",                   10000],
    ["legal",         "Legal, insurance, company setup",     8000],
    ["bufferMonths",  "Months of costs kept as buffer",         3],
  ]},
  { title: "Staff per month (€)", fields: [
    ["headCoach",     "Head coach",                          3800],
    ["asstCoaches",   "Assistant coaches (number)",             2],
    ["asstSalary",    "Salary per assistant",                2000],
    ["gymCoach",      "Fitness coach (if fitness zone)",     2800],
    ["admin",         "Admin / front desk",                  2000],
    ["cleaning",      "Cleaning & maintenance staff",        1200],
  ]},
  { title: "Other monthly costs (€)", fields: [
    ["insurance",     "Insurance",                            900],
    ["software",      "Booking & payment software",           300],
    ["maintenance",   "Repairs & equipment upkeep",           500],
    ["brand",         "Brand marketing (not acquisition)",    800],
  ]},
  { title: "Other revenue", fields: [
    ["adultFee",      "Adult monthly fee (€)",                 45],
    ["pickupFee",     "Pickup fee per visit (€)",               7],
    ["campKids",      "Kids per camp week",                    40],
    ["campFee",       "Camp fee per kid per week (€)",        180],
    ["campCostPct",   "Camp running cost (% of camp revenue)", 40],
    ["privateHrs",    "Private 1:1 sessions per month",        30],
    ["privateFee",    "Price per private session (€)",         45],
    ["parties",       "Birthday parties per month",             6],
    ["partyFee",      "Price per party (€)",                  220],
    ["rentalHrs",     "Court hours rented out per month",      20],
    ["rentalRate",    "Court rental per hour (€)",             60],
    ["sponsor",       "Local sponsorship per month (€)",      800],
  ]},
];
const DEFAULTS = Object.fromEntries([
  ...LEVERS.map(l => [l.k, l.v]),
  ...GROUPS.flatMap(g => g.fields.map(([k,,v]) => [k, v])),
]);
let A = { ...DEFAULTS, ...(saved.A || {}) };

function compute() {
  const n = A.n;
  // ---- Space ----
  const totalArea = A.courtArea + A.gymArea + A.supportArea;
  // ---- Students ----
  const capacity = Math.floor(A.kidsSessions * A.group / A.perKid);
  const kids = Math.round(capacity * A.occ / 100);
  const churn = A.churnPct / 100;
  const members = kids + A.gymMembers;                       // people we pay to acquire
  // ---- Revenue ----
  const camp = A.campWeeks * A.campKids * A.campFee / 12;     // averaged per month
  const streams = [
    ["Kids coaching",         kids * A.kidsFee],
    ["Fitness memberships",   A.gymArea > 0 ? A.gymMembers * A.gymFee : 0],
    ["Holiday camps (avg)",   camp],
    ["Adult training",        A.adults * A.adultFee],
    ["Pickup games",          A.pickup * A.pickupFee],
    ["Private 1:1 coaching",  A.privateHrs * A.privateFee],
    ["Birthday parties",      A.parties * A.partyFee],
    ["Court rental",          A.rentalHrs * A.rentalRate],
    ["Sponsorship",           A.sponsor],
  ];
  const revenue = streams.reduce((s, [, v]) => s + v, 0);
  // ---- Costs ----
  const rent = totalArea * A.rentPerM2;
  const acqMonthly = A.cac * churn * members;                // replacing students who leave
  const costs = [
    ["Rent",                   rent],
    ["Utilities",              totalArea * A.utilPerM2],
    ["Head coach",             A.headCoach],
    ["Assistant coaches",      A.asstCoaches * A.asstSalary],
    ["Fitness coach",          A.gymArea > 0 ? A.gymCoach : 0],
    ["Admin / front desk",     A.admin],
    ["Cleaning & maintenance", A.cleaning],
    ["Insurance",              A.insurance],
    ["Software",               A.software],
    ["Repairs & upkeep",       A.maintenance],
    ["Brand marketing",        A.brand],
    ["Student acquisition",    acqMonthly],
    ["Camp running costs",     camp * A.campCostPct / 100],
  ];
  const monthlyCost = costs.reduce((s, [, v]) => s + v, 0);
  const profit = revenue - monthlyCost;
  // ---- Investment ----
  const gymEquip = A.gymArea * A.gymEquipPerM2;
  const gymFloor = A.gymArea * A.gymFloorPerM2;
  const fitout = A.courtFitout + gymEquip + gymFloor + A.supportFitout;
  const grant = fitout * A.grantPct / 100;
  const inv = [
    ["Basketball court fit-out",              A.courtFitout],
    ["Fitness equipment",                     gymEquip],
    ["Fitness flooring",                      gymFloor],
    ["Changing rooms & reception",            A.supportFitout],
    ["Launch marketing",                      A.launch],
    ["Legal, insurance, company setup",       A.legal],
    [`Rent deposit (${A.depositMonths} months)`, rent * A.depositMonths],
    [`Acquiring the first ${fmtInt(members)} students`, A.cac * members],
    [`Running-cost buffer (${A.bufferMonths} months)`, monthlyCost * A.bufferMonths],
  ];
  if (grant) inv.push([`Less grants (${A.grantPct}% of fit-out)`, -grant]);
  const perAcademyInvest = inv.reduce((s, [, v]) => s + v, 0);
  // ---- Break-even occupancy: profit is linear in the number of kids ----
  const perKidMargin = A.kidsFee - A.cac * churn;
  const profitNoKids = profit - kids * perKidMargin;
  let breakEvenOcc = profitNoKids >= 0 ? 0 : (perKidMargin > 0 ? -profitNoKids / (capacity * perKidMargin) : Infinity);

  const coaches = 1 + A.asstCoaches + (A.gymArea > 0 ? 1 : 0);
  const lifetimeMonths = churn > 0 ? 1 / churn : 0;
  return {
    n, totalArea, capacity, kids, members, streams, revenue, costs, monthlyCost, profit,
    fitout, grant, inv, perAcademyInvest, investment: perAcademyInvest * n,
    payback: profit > 0 ? perAcademyInvest / profit : null,
    breakEvenOcc, coaches, lifetimeMonths,
    ltv: A.kidsFee * lifetimeMonths,
    staff: coaches + 2,
  };
}

// ---- Levers ----
function leverHtml(l) {
  return `<div class="lever${l.main ? " main" : ""}">
    <div class="lever-top"><span class="lever-label">${l.label}</span><span class="lever-value" id="lv_${l.k}"></span></div>
    <input type="range" id="l_${l.k}" min="${l.min}" max="${l.max}" step="${l.step}" value="${A[l.k]}" aria-label="${l.label}">
  </div>`;
}
$("leversCourt").innerHTML = LEVERS_COURT.map(leverHtml).join("");
$("leversOther").innerHTML = LEVERS_OTHER.map(leverHtml).join("");
LEVERS.forEach(l => $("l_" + l.k).addEventListener("input", e => {
  A[l.k] = Number(e.target.value); save(); renderAll();
}));

// ---- Detailed assumptions ----
function buildAssumptions() {
  $("groups").innerHTML = GROUPS.map(g => `
    <div class="group"><h3>${g.title}</h3>
      ${g.fields.map(([k, label]) => `
        <div class="field"><label for="f_${k}">${label}</label>
          <input id="f_${k}" data-k="${k}" type="number" min="0" step="any" inputmode="decimal" value="${A[k]}"></div>`).join("")}
    </div>`).join("");
  $("groups").querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    A[inp.dataset.k] = Math.max(0, Number(inp.value) || 0);
    if (A.perKid === 0) A.perKid = 1;
    save(); renderAll();
  }));
}
$("reset").addEventListener("click", () => {
  A = { ...DEFAULTS }; save();
  LEVERS.forEach(l => $("l_" + l.k).value = A[l.k]);
  buildAssumptions(); renderAll();
});

$("gymKit").innerHTML = GYM_KIT.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");

function renderCalc(m) {
  const n = m.n;
  LEVERS.forEach(l => $("lv_" + l.k).textContent =
    l.k === "n" ? plural(n, "academy", "academies") : (l.fmt ? l.fmt(A[l.k]) : A[l.k]));
  document.querySelectorAll(".thAll").forEach(th => th.textContent = `All ${plural(n, "academy", "academies")}`);

  // Space
  $("cardsSpace").innerHTML = [
    { hero: true, label: "Total area per academy", value: fmtInt(m.totalArea) + " m²", sub: `${fmtInt(m.totalArea * n)} m² across ${plural(n, "academy", "academies")}` },
    { label: "Basketball court", value: fmtInt(A.courtArea) + " m²", sub: "28 × 15 m court + run-off, 7 m+ ceiling" },
    { label: "Fitness zone", value: fmtInt(A.gymArea) + " m²", sub: A.gymArea ? "Rigs, barbells, dumbbells, rowers, bikes" : "No fitness zone" },
    { label: "Changing, reception, storage", value: fmtInt(A.supportArea) + " m²", sub: "Toilets, showers, office, kit room" },
    { label: "Rent", value: short(m.totalArea * A.rentPerM2), sub: `per month at €${A.rentPerM2}/m²` },
  ].map(cardHtml).join("");
  const parts = [["Court", A.courtArea, "#ff7a1a"], ["Fitness zone", A.gymArea, "#4da3ff"], ["Support", A.supportArea, "#9aa1ad"]];
  $("areaBar").innerHTML = parts.filter(p => p[1] > 0).map(([l, v, c]) =>
    `<div style="flex:${v};background:${c}" title="${l}: ${fmtInt(v)} m²">${v / m.totalArea > .12 ? `${l} ${fmtInt(v)} m²` : ""}</div>`).join("");
  $("areaLegend").innerHTML = parts.map(([l, v, c]) => `<span><i style="background:${c}"></i>${l}: ${fmtInt(v)} m² (${pct(v / m.totalArea)})</span>`).join("");

  // Money needed
  $("cardsMoney").innerHTML = [
    { hero: true, label: "Total investment needed", value: short(m.investment), sub: `${short(m.perAcademyInvest)} per academy × ${n}` },
    { label: "Fit-out (court + gym + rooms)", value: short(m.fitout * n), sub: `${short(m.fitout)} per academy` },
    { label: "Grants used", value: short(m.grant * n), sub: `${A.grantPct}% of fit-out. See EU funding`, go: "funding" },
    { label: "Investment per m²", value: eur(m.perAcademyInvest / m.totalArea), sub: "Total investment ÷ floor area" },
    { label: "Investment per kid place", value: short(m.perAcademyInvest / m.capacity), sub: `÷ ${fmtInt(m.capacity)} places at full capacity` },
  ].map(cardHtml).join("");

  // Students
  const beo = m.breakEvenOcc;
  $("cardsStudents").innerHTML = [
    { hero: true, label: "Kids enrolled", value: fmtInt(m.kids * n), sub: `${fmtInt(m.kids)} per academy at ${A.occ}% occupancy` },
    { label: "Maximum capacity", value: fmtInt(m.capacity * n), sub: `${A.kidsSessions} sessions × ${A.group} kids ÷ ${A.perKid} per kid / week` },
    { label: "Break-even occupancy", value: beo === Infinity || beo > 1 ? `<span class="neg">${beo === Infinity ? "Never" : ">100%"}</span>` : pct(beo),
      sub: "The court occupancy needed to stop losing money" },
    { label: "Fitness members", value: fmtInt(A.gymMembers * n), sub: A.gymArea ? `${(A.gymMembers / A.gymArea).toFixed(2)} members per m²` : "No fitness zone" },
    { label: "Adults + pickup visits", value: fmtInt(A.adults * n) + " + " + fmtInt(A.pickup * n), sub: "Members + drop-in visits / month" },
    { label: "Coaches employed", value: m.coaches * n, sub: `${m.coaches} per academy (+ admin & cleaning)` },
  ].map(cardHtml).join("");

  // P&L
  $("cardsPL").innerHTML = [
    { label: "Monthly revenue", value: short(m.revenue * n), sub: `${eur(m.revenue)} per academy` },
    { label: "Monthly running cost", value: short(m.monthlyCost * n), sub: `${eur(m.monthlyCost)} per academy` },
    { hero: true, label: "Monthly profit", value: sign(m.profit * n), sub: `Yearly: ${short(m.profit * n * 12)}` },
    { label: "Profit margin", value: m.revenue ? `<span class="${m.profit >= 0 ? "pos" : "neg"}">${pct(m.profit / m.revenue)}</span>` : "–", sub: "Profit ÷ revenue" },
    { label: "Payback period", value: m.payback === null ? `<span class="neg">Never</span>` : `${Math.ceil(m.payback)} months`,
      sub: m.payback === null ? "Costs are higher than revenue" : `≈ ${(m.payback / 12).toFixed(1)} years to earn back the investment` },
  ].map(cardHtml).join("");

  // Unit economics
  $("cardsUnit").innerHTML = [
    { label: "Cost to acquire a student", value: eur(A.cac), sub: "Ads, trial sessions, school visits per sign-up" },
    { label: "Lifetime value of a kid", value: eur(m.ltv), sub: `€${A.kidsFee} × ${m.lifetimeMonths.toFixed(0)} months average stay` },
    { label: "Lifetime value ÷ acquisition cost", value: A.cac ? (m.ltv / A.cac).toFixed(1) + "×" : "∞", sub: "Above 3× is healthy" },
    { label: "Acquisition payback", value: A.cac ? (A.cac / A.kidsFee).toFixed(1) + " months" : "0", sub: "Months of fees to recover the cost to acquire" },
    { label: "Revenue per m² per year", value: eur(m.revenue * 12 / m.totalArea), sub: "How hard the space works" },
    { label: "Cost per kid per month", value: eur(m.monthlyCost / Math.max(1, m.kids + A.gymMembers + A.adults)), sub: "Running cost ÷ all members" },
  ].map(cardHtml).join("");

  // Tables
  const tbl = (rows, total, totalLabel, withShare = true) =>
    rows.map(([l, v]) => `<tr><td>${l}</td><td>${eur(v)}</td><td>${eur(v * n)}</td>${withShare ? `<td>${total ? pct(v / total) : "0%"}</td>` : ""}</tr>`).join("") +
    `<tr class="total"><td>${totalLabel}</td><td>${eur(total)}</td><td>${eur(total * n)}</td>${withShare ? "<td>100%</td>" : ""}</tr>`;
  $("revTable").innerHTML = tbl(m.streams, m.revenue, "Total revenue");
  $("costTable").innerHTML = tbl(m.costs, m.monthlyCost, "Total running cost");
  $("invTable").innerHTML = tbl(m.inv, m.perAcademyInvest, "Total investment", false);
}

function renderAbout(m) {
  const top = rankCities()[0];
  $("aboutCards").innerHTML = [
    { hero: true, label: "Total investment needed", value: short(m.investment), sub: `For ${plural(m.n, "academy", "academies")}. Change it in the Calculator`, go: "calc" },
    { label: "Total area", value: fmtInt(m.totalArea * m.n) + " m²", sub: "Court + fitness zone + support space", go: "calc" },
    { label: "Target age group", value: "8–18", sub: "Primary and secondary school kids" },
    { label: "Kids enrolled", value: fmtInt(m.kids * m.n), sub: `${A.occ}% occupancy`, go: "calc" },
    { label: "Monthly profit", value: sign(m.profit * m.n), sub: m.payback ? `Payback in ${Math.ceil(m.payback)} months` : "Not profitable yet", go: "calc" },
    { label: "Kids per coach", value: `${A.group}`, sub: "vs 4–8 in racket sports", go: "why" },
    { label: "Revenue streams", value: STREAMS.reduce((s, g) => s + g.items.length, 0), sub: "See Revenue streams", go: "revenue" },
    { label: "Top city right now", value: top.name, sub: `Score ${top.score.toFixed(0)}/100`, go: "cities" },
  ].map(cardHtml).join("");
}

// =====================================================================
// WHY BASKETBALL
// =====================================================================
let WHY = { area: 608, coach: 35, ...(saved.WHY || {}) };
$("whyArea").value = WHY.area;
$("whyCoach").value = WHY.coach;
$("whyArea").addEventListener("input", e => { WHY.area = Number(e.target.value); save(); renderWhy(); renderDeck(); });
$("whyCoach").addEventListener("input", e => { WHY.coach = Number(e.target.value); save(); renderWhy(); renderDeck(); });

// The space is a rectangle with the same shape as a basketball footprint (32:19).
function spaceDims(area) {
  const w = Math.sqrt(area * 32 / 19);
  return [w, area / w];
}
// How many court footprints physically fit in a W×H rectangle (tries both orientations).
function fitCourts(sport, area) {
  const [W, H] = spaceDims(area);
  const [a, b] = sport.footprint;
  const opt = (fw, fh) => ({ cols: Math.floor(W / fw), rows: Math.floor(H / fh), fw, fh });
  const o1 = opt(a, b), o2 = opt(b, a);
  const best = o1.cols * o1.rows >= o2.cols * o2.rows ? o1 : o2;
  return { ...best, count: best.cols * best.rows, W, H, rotated: best === o2 };
}
function sportMetrics(s, area, coachRate) {
  const fit = fitCourts(s, area);
  const fpArea = s.footprint[0] * s.footprint[1];
  const students = fit.count * s.group;
  const investment = fit.count * s.courtCost;
  return {
    s, fit, fpArea, students, investment,
    coaches: fit.count,
    perCoach: s.group,
    coachPerKidHr: coachRate / s.group,
    invPerPlace: s.courtCost / s.group,
    m2PerKid: fpArea / s.group,
    invPerM2: s.courtCost / fpArea,
    usedPct: fit.count * fpArea / area,
  };
}
const allSportMetrics = () => SPORTS.map(s => sportMetrics(s, WHY.area, WHY.coach));

function sportSvg(m) {
  const { fit, s } = m;
  const pad = 0.6, k = 10;                                    // 1 m = 10 svg units
  const VW = (fit.W + pad * 2) * k, VH = (fit.H + pad * 2) * k;
  let g = `<rect x="${pad * k}" y="${pad * k}" width="${fit.W * k}" height="${fit.H * k}" fill="none" stroke="#5a6170" stroke-width="3" stroke-dasharray="10 6"/>`;
  const [cw, ch] = fit.rotated ? [s.court[1], s.court[0]] : s.court;
  for (let r = 0; r < fit.rows; r++) for (let c = 0; c < fit.cols; c++) {
    const x0 = pad + c * fit.fw, y0 = pad + r * fit.fh;
    const cx = x0 + (fit.fw - cw) / 2, cy = y0 + (fit.fh - ch) / 2;
    g += `<rect x="${x0 * k}" y="${y0 * k}" width="${fit.fw * k}" height="${fit.fh * k}" fill="${s.color}" fill-opacity=".10" stroke="${s.color}" stroke-opacity=".35"/>`;
    g += `<rect x="${cx * k}" y="${cy * k}" width="${cw * k}" height="${ch * k}" fill="${s.color}" fill-opacity=".22" stroke="${s.color}" stroke-width="2"/>`;
    // students in a grid inside the court
    const n = s.group;
    const cols = Math.max(1, Math.round(Math.sqrt(n * cw / ch)));
    const rows = Math.ceil(n / cols);
    const dx = cw / cols, dy = ch / rows;
    const rad = Math.min(dx, dy) * 0.28 * k;
    for (let i = 0; i < n; i++) {
      const px = cx + dx * (i % cols + .5), py = cy + dy * (Math.floor(i / cols) + .5);
      g += `<circle cx="${px * k}" cy="${py * k}" r="${rad}" fill="${s.color}"/>`;
    }
    // coach: a white square at the court's edge
    const cs = Math.max(rad * 2.2, 6);
    g += `<rect x="${(cx + cw / 2) * k - cs / 2}" y="${cy * k - cs / 2}" width="${cs}" height="${cs}" fill="#fff" stroke="#111" stroke-width="1.5"/>`;
  }
  return `<svg viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="${s.name}: ${fit.count} courts in ${fmtInt(WHY.area)} m²">${g}</svg>`;
}

function renderWhy() {
  $("whyAreaV").textContent = fmtInt(WHY.area) + " m²";
  $("whyCoachV").textContent = "€" + WHY.coach;
  const ms = allSportMetrics();

  $("sportPanels").innerHTML = ms.map(m => `
    <div class="sport${m.s.k === "basketball" ? " win" : ""}">
      <h3><span>${m.s.icon} ${m.s.name}</span><span class="tag">${plural(m.fit.count, "court", "courts")}</span></h3>
      ${sportSvg(m)}
      <div class="kv">
        <span>Kids training at once</span><span>${fmtInt(m.students)}</span>
        <span>Coaches needed</span><span>${m.coaches}</span>
        <span>Kids per coach</span><span>${m.s.range}</span>
        <span>Fit-out investment</span><span>${short(m.investment)}</span>
        <span>Space one court needs</span><span>${fmtInt(m.fpArea)} m² (${m.s.footprint.join(" × ")} m)</span>
        <span>Investment per m²</span><span>${eur(m.invPerM2)}</span>
        <span>Minimum ceiling</span><span>${m.s.ceiling} m</span>
      </div>
      <p class="small muted" style="margin:8px 0 0">${m.s.note}</p>
    </div>`).join("");

  const chart = (title, sub, key, fmt, lowerBetter) => {
    const max = Math.max(...ms.map(m => m[key])) || 1;
    const best = lowerBetter ? Math.min(...ms.map(m => m[key])) : Math.max(...ms.map(m => m[key]));
    return `<div class="chart-box"><h3>${title}</h3><div class="small muted">${sub}</div>
      ${ms.map(m => `<div class="hbar-row"><span>${m.s.icon} ${m.s.name}</span>
        <div class="hbar"><span style="width:${Math.max(2, m[key] / max * 100)}%;background:${m.s.color};opacity:${m[key] === best ? 1 : .55}"></span></div>
        <span class="v">${fmt(m[key])}</span></div>`).join("")}</div>`;
  };
  $("sportCharts").innerHTML = [
    chart("Kids per coach", "One coach, one court, one session. Higher is better", "perCoach", v => v, false),
    chart("Coach cost per kid per hour", `At €${WHY.coach}/hour per coach. Lower is better`, "coachPerKidHr", v => "€" + v.toFixed(2), true),
    chart(`Kids training at once in ${fmtInt(WHY.area)} m²`, "Higher is better", "students", v => fmtInt(v), false),
    chart(`Coaches needed for ${fmtInt(WHY.area)} m²`, "Lower is better", "coaches", v => v, true),
    chart("Floor space per kid", "m² of court footprint per kid in a session. Lower is better", "m2PerKid", v => v.toFixed(1) + " m²", true),
    chart("Fit-out investment per kid place", "One court's fit-out ÷ kids per session. Lower is better", "invPerPlace", v => eur(v), true),
    chart("Fit-out investment per m²", "One court's fit-out ÷ its footprint", "invPerM2", v => eur(v), true),
  ].join("");

  const rows = [
    ["Official court size", m => m.s.court.join(" × ") + " m"],
    ["Space one court needs (incl. run-off)", m => `${fmtInt(m.fpArea)} m²`],
    ["Minimum ceiling height", m => m.s.ceiling + " m"],
    ["Kids per coach per court", m => m.s.range],
    [`Courts that fit in ${fmtInt(WHY.area)} m²`, m => m.fit.count],
    ["Kids training at once", m => fmtInt(m.students)],
    ["Coaches needed", m => m.coaches],
    ["Fit-out cost per court", m => eur(m.s.courtCost)],
    ["Total fit-out for the space", m => eur(m.investment)],
    ["Fit-out per m²", m => eur(m.invPerM2)],
    ["Fit-out per kid place", m => eur(m.invPerPlace)],
    ["Floor space per kid", m => m.m2PerKid.toFixed(1) + " m²"],
    ["Coach cost per kid per hour", m => "€" + m.coachPerKidHr.toFixed(2)],
    ["Share of the space used", m => pct(m.usedPct)],
  ];
  $("sportTable").innerHTML =
    `<thead><tr><th>Metric</th>${ms.map(m => `<th>${m.s.icon} ${m.s.name}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([l, f]) => `<tr><td>${l}</td>${ms.map(m => `<td>${f(m)}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

// =====================================================================
// REVENUE STREAMS (static)
// =====================================================================
$("streams").innerHTML = STREAMS.map(g => `
  <h2>${g.group}</h2>
  <div class="grid-2">${g.items.map(([name, price, inCalc, desc]) => `
    <div class="box stream"><h3>${name}</h3>
      <div><span class="price">${price}</span> ${inCalc ? '<span class="tag in">In calculator</span>' : ""}</div>
      <p>${desc}</p></div>`).join("")}</div>`).join("");

// =====================================================================
// FUNDING (static)
// =====================================================================
const TYPE_TAG = { eu: '<span class="tag eu">EU</span>', nat: '<span class="tag nat">National</span>', pri: '<span class="tag pri">Private</span>' };
$("funds").innerHTML = FUNDS.map(f => `
  <div class="box fund"><div>${TYPE_TAG[f.type]}</div><h3>${f.name}</h3>
    <div class="amount">${f.amount}</div><ul>${f.pts.map(p => `<li>${p}</li>`).join("")}</ul></div>`).join("");
$("fundCards").innerHTML = [
  { hero: true, label: "Realistic grant funding, year 1", value: "€30k–€90k", sub: "1 small-scale Erasmus+ grant + national/city grants" },
  { label: "Grant funding, years 2–3 (multi-city)", value: "€150k–€450k", sub: "Cooperation partnership + an event" },
  { label: "Largest single EU sport grant", value: "€400k", sub: "Erasmus+ cooperation partnership" },
  { label: "Ireland equipment-only cap", value: "€70k", sub: "Sports Capital & Equipment Programme" },
].map(cardHtml).join("");
$("fundSources").innerHTML = FUND_SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join("");

// =====================================================================
// CITIES
// =====================================================================
let W = Object.fromEntries(FACTORS.map(f => [f.k, f.w]));
Object.assign(W, saved.W || {});
const CITIES = CITY_DATA.map(([name, country, ...rest]) => {
  const why = rest.pop();
  return { name, country, why, s: Object.fromEntries(FACTORS.map((f, i) => [f.k, rest[i]])) };
});
function rankCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  return CITIES.map(c => ({ ...c, score: FACTORS.reduce((s, f) => s + c.s[f.k] * W[f.k], 0) / tw * 10 }))
               .sort((a, b) => b.score - a.score);
}
$("weights").innerHTML = FACTORS.map(f => `
  <div class="lever">
    <div class="lever-top"><span class="lever-label">${f.label}</span><span class="lever-value" id="wv_${f.k}"></span></div>
    <input type="range" id="w_${f.k}" min="0" max="40" step="1" value="${W[f.k]}" aria-label="Weight: ${f.label}">
    <div class="small muted">${f.why}</div>
  </div>`).join("");
FACTORS.forEach(f => $("w_" + f.k).addEventListener("input", e => { W[f.k] = Number(e.target.value); save(); renderAll(); }));
$("resetWeights").addEventListener("click", () => {
  FACTORS.forEach(f => { W[f.k] = f.w; $("w_" + f.k).value = f.w; });
  save(); renderAll();
});

function renderCities() {
  const tw = FACTORS.reduce((s, f) => s + W[f.k], 0) || 1;
  FACTORS.forEach(f => $("wv_" + f.k).textContent = Math.round(W[f.k] / tw * 100) + "%");
  const ranked = rankCities();
  $("top5").innerHTML = ranked.slice(0, 5).map((c, i) => {
    const best = FACTORS.slice().sort((a, b) => c.s[b.k] - c.s[a.k]).slice(0, 3);
    return `<div class="box"><div class="rank"><div class="rank-num">${i + 1}</div><div style="flex:1">
      <h3>${c.name} <span class="muted small">· ${c.country}</span></h3>
      <div class="small">Score <span class="score">${c.score.toFixed(1)}</span> / 100</div>
      <div class="bar"><span style="width:${c.score}%"></span></div>
      <p class="small muted" style="margin:10px 0 6px">${c.why}</p>
      <div>${best.map(f => `<span class="tag">${f.label}: ${c.s[f.k]}/10</span>`).join("")}</div>
    </div></div></div>`;
  }).join("");
  $("cityHead").innerHTML = `<tr><th>#</th><th class="l">City</th><th>Score</th>${FACTORS.map(f => `<th>${f.label}</th>`).join("")}</tr>`;
  $("cityBody").innerHTML = ranked.map((c, i) => `
    <tr${i < 5 ? ' class="hl"' : ""}><td>${i + 1}</td><td class="l"><b>${c.name}</b><br><span class="muted small">${c.country}</span></td>
      <td class="score">${c.score.toFixed(1)}</td>${FACTORS.map(f => `<td>${c.s[f.k]}</td>`).join("")}</tr>`).join("");
}

// =====================================================================
// PARAMETERS (static)
// =====================================================================
let pn = 0;
$("paramList").innerHTML = PARAMS.map(g => `
  <h2>${g.group}</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>#</th><th class="l">Parameter / requirement</th><th class="l">Where it is</th></tr></thead>
    <tbody>${g.items.map(([p, where]) => `<tr><td>${++pn}</td><td class="l">${p}</td><td class="l muted">${where}</td></tr>`).join("")}</tbody>
  </table></div>`).join("");
$("dupList").innerHTML = DUPLICATES.map(d => `<li>${d}</li>`).join("");

// =====================================================================
// DECK (built from live numbers)
// =====================================================================
let slide = Number(saved.slide) || 0;

function buildSlides(m) {
  const n = m.n;
  const ms = allSportMetrics();
  const bb = ms.find(x => x.s.k === "basketball");
  const others = ms.filter(x => x.s.k !== "basketball");
  const topStreams = m.streams.slice().sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topInv = m.inv.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const cities = rankCities().slice(0, 3);
  const beo = m.breakEvenOcc;
  const per = m.perAcademyInvest, pr = m.profit;
  return [
    `<div class="kicker">Investor deck</div>
     <h2>A youth basketball academy<br>+ functional fitness zone</h2>
     <p>Basketball for kids aged 8–18, near schools in dense family neighbourhoods across Europe.</p>
     <div class="grid mt">${[
        { hero: true, label: "Investment needed", value: short(m.investment), sub: plural(n, "academy", "academies") },
        { label: "Total area", value: fmtInt(m.totalArea * n) + " m²", sub: "Court + fitness + support" },
        { label: "Kids enrolled", value: fmtInt(m.kids * n), sub: `${A.occ}% occupancy` },
        { label: "Monthly profit", value: sign(pr * n), sub: m.payback ? `Payback ${Math.ceil(m.payback)} months` : "Not yet profitable" },
     ].map(cardHtml).join("")}</div>`,

    `<div class="kicker">The opportunity</div>
     <h2>Kids need somewhere close by to play</h2>
     <ul>
       <li>Basketball is growing fast in Europe (Olympic 3×3, European NBA stars), but courts and academies are scarce.</li>
       <li>Parents want structured after-school activity within walking distance of school and home.</li>
       <li>Ages 8–18: grouped 8–11 fundamentals, 12–14 development, 15–18 competitive.</li>
       <li>Parents waiting during sessions become customers of the fitness zone.</li>
     </ul>`,

    `<div class="kicker">Why basketball</div>
     <h2>The most kids per coach</h2>
     <div class="big">${bb.s.range}</div><p>kids per coach on one court, vs ${others.map(o => `${o.s.name.toLowerCase()} ${o.s.range}`).join(", ")}.</p>
     <div class="grid mt">${[
        { hero: true, label: `Basketball in ${fmtInt(WHY.area)} m²`, value: `${bb.students} kids`, sub: `${bb.coaches} coach` },
        ...others.slice(0, 3).map(o => ({ label: `${o.s.name} in ${fmtInt(WHY.area)} m²`, value: `${o.students} kids`, sub: plural(o.coaches, "coach", "coaches") })),
     ].map(cardHtml).join("")}</div>`,

    `<div class="kicker">The facility</div>
     <h2>${fmtInt(m.totalArea)} m² per academy</h2>
     <div class="areabar" style="height:56px">${[["Basketball court", A.courtArea, "#ff7a1a"], ["Fitness zone", A.gymArea, "#4da3ff"], ["Support", A.supportArea, "#9aa1ad"]]
        .filter(p => p[1] > 0).map(([l, v, c]) => `<div style="flex:${v};background:${c}">${v / m.totalArea > .12 ? `${l} · ${fmtInt(v)} m²` : ""}</div>`).join("")}</div>
     <ul class="mt">
       <li><b>Court:</b> full-size 28 × 15 m, sprung wooden floor, 6 hoops, 7 m+ ceiling.</li>
       <li><b>Fitness zone:</b> rigs, barbells, dumbbells, kettlebells, rowers, air bikes, circuit training.</li>
       <li><b>Support:</b> changing rooms, toilets, reception, kit storage.</li>
       <li>Rent: ${eur(m.totalArea * A.rentPerM2)} / month at €${A.rentPerM2}/m².</li>
     </ul>`,

    `<div class="kicker">Money needed</div>
     <h2>Total investment</h2>
     <div class="big">${short(m.investment)}</div>
     <p>${short(per)} per academy × ${n}${m.grant ? `, after ${short(m.grant * n)} of grants` : ""}.</p>
     <div class="table-scroll mt"><table><tbody>
       ${topInv.map(([l, v]) => `<tr><td>${l}</td><td>${eur(v)}</td><td>${pct(v / per)}</td></tr>`).join("")}
     </tbody></table></div>`,

    `<div class="kicker">How we make money</div>
     <h2>${short(m.revenue * n)} revenue per month</h2>
     <div style="max-width:720px">${topStreams.map(([l, v]) => `
       <div class="hbar-row" style="grid-template-columns:170px 1fr 80px"><span>${l}</span>
         <div class="hbar"><span style="width:${v / topStreams[0][1] * 100}%;background:var(--accent)"></span></div>
         <span class="v">${pct(v / m.revenue)}</span></div>`).join("")}</div>
     <p class="small muted mt">Plus ${STREAMS.reduce((s, g) => s + g.items.length, 0) - topStreams.length} more possible streams: leagues, school partnerships, events, merchandise, coach education…</p>`,

    `<div class="kicker">Unit economics</div>
     <h2>Each kid is worth ${eur(m.ltv)}</h2>
     <div class="grid">${[
        { label: "Kids monthly fee", value: eur(A.kidsFee) },
        { label: "Cost to acquire a kid", value: eur(A.cac) },
        { label: "Average stay", value: m.lifetimeMonths.toFixed(0) + " months" },
        { hero: true, label: "Lifetime value ÷ acquisition cost", value: A.cac ? (m.ltv / A.cac).toFixed(1) + "×" : "∞" },
        { label: "Capacity per academy", value: fmtInt(m.capacity) + " kids" },
        { label: "Occupancy", value: A.occ + "%" },
     ].map(cardHtml).join("")}</div>`,

    `<div class="kicker">Profit & break-even</div>
     <h2>${pr >= 0 ? "Profitable" : "Loss-making"} at ${A.occ}% occupancy</h2>
     <div class="grid">${[
        { hero: true, label: "Monthly profit", value: sign(pr * n), sub: `Margin ${m.revenue ? pct(pr / m.revenue) : "–"}` },
        { label: "Break-even occupancy", value: beo === Infinity || beo > 1 ? "Not reachable" : pct(beo), sub: "Court places that must be filled" },
        { label: "Payback period", value: m.payback ? `${Math.ceil(m.payback)} months` : "Never" },
        { label: "Yearly profit", value: sign(pr * n * 12) },
     ].map(cardHtml).join("")}</div>`,

    `<div class="kicker">Funding</div>
     <h2>Grants reduce the founder capital needed</h2>
     <ul>
       <li><b>Erasmus+ Sport small-scale partnership:</b> €30k or €60k (needs 1 partner in another EU country).</li>
       <li><b>Erasmus+ Sport cooperation partnership:</b> €120k / €250k / €400k (3 countries).</li>
       <li><b>National sport capital grants</b> (e.g. Ireland: up to €200k, or €70k for equipment only).</li>
       <li>Realistic: <b>€30k–€90k in year 1</b>, through a non-profit club partner.</li>
     </ul>`,

    `<div class="kicker">Where</div>
     <h2>Top cities to start</h2>
     <div class="grid">${cities.map((c, i) => cardHtml({ hero: i === 0, label: `#${i + 1} · ${c.country}`, value: c.name, sub: `Score ${c.score.toFixed(0)}/100` })).join("")}</div>
     <p class="mt">Scored on population density, share of kids, nearness to schools and family housing, basketball interest, supply gap, income and costs.</p>`,

    `<div class="kicker">Scaling</div>
     <h2>From 1 academy to a network</h2>
     <div class="table-scroll"><table>
       <thead><tr><th>Academies</th><th>Investment</th><th>Kids</th><th>Monthly profit</th><th>Yearly profit</th></tr></thead>
       <tbody>${[1, 3, 5, 10].map(k => `<tr${k === n ? ' class="hl"' : ""}><td>${k}</td><td>${short(per * k)}</td><td>${fmtInt(m.kids * k)}</td><td>${sign(pr * k)}</td><td>${sign(pr * k * 12)}</td></tr>`).join("")}</tbody>
     </table></div>
     <p class="small muted mt">Each academy is assumed to perform like the first one. In practice, shared admin and marketing make each extra academy cheaper.</p>`,

    `<div class="kicker">The ask</div>
     <h2>${short(m.investment)} to open ${plural(n, "academy", "academies")}</h2>
     <ul>
       <li>${fmtInt(m.totalArea * n)} m² of courts and fitness space.</li>
       <li>${fmtInt(m.capacity * n)} kid places, ${fmtInt(m.kids * n)} enrolled at ${A.occ}% occupancy.</li>
       <li>${m.coaches * n} coaches employed.</li>
       <li>${m.payback ? `Payback in about ${(m.payback / 12).toFixed(1)} years.` : "The model needs higher occupancy or prices to turn a profit."}</li>
     </ul>`,
  ];
}

function renderDeck() {
  const slides = buildSlides(compute());
  slide = Math.min(Math.max(0, slide), slides.length - 1);
  $("deck").innerHTML = slides.map((s, i) => `<div class="slide${i === slide ? " active" : ""}">${s}</div>`).join("");
  $("dots").innerHTML = slides.map((_, i) => `<button class="${i === slide ? "on" : ""}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");
  $("slideCount").textContent = `${slide + 1} / ${slides.length}`;
  $("prevSlide").disabled = slide === 0;
  $("nextSlide").disabled = slide === slides.length - 1;
}
function goSlide(i) { slide = i; save(); renderDeck(); }
$("prevSlide").addEventListener("click", () => goSlide(slide - 1));
$("nextSlide").addEventListener("click", () => goSlide(slide + 1));
$("dots").addEventListener("click", e => { if (e.target.dataset.i) goSlide(Number(e.target.dataset.i)); });
$("fullscreen").addEventListener("click", () => {
  const d = $("deck");
  if (document.fullscreenElement) document.exitFullscreen();
  else if (d.requestFullscreen) d.requestFullscreen();
});
document.addEventListener("keydown", e => {
  if (currentTab !== "deck" || e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); goSlide(slide + 1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goSlide(slide - 1); }
});

// =====================================================================
// Boot
// =====================================================================
function renderAll() {
  const m = compute();
  renderCalc(m);
  renderCities();
  renderAbout(m);
  renderDeck();
}
buildAssumptions();
renderWhy();
renderAll();
showTab(location.hash.slice(1));
