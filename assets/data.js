// =====================================================================
// All content and reference data for the site lives here, so the
// numbers can be updated without touching the page logic in app.js.
// =====================================================================

// ---------------------------------------------------------------------
// Sports compared on the "Why basketball" tab.
// court     = official playing area (m)
// footprint = court + safety run-off / walls, i.e. the floor space one court really needs (m)
// group     = students one coach can run on one court in a coaching session
// courtCost = indicative fit-out cost of ONE indoor court inside a rented shell
//             (floor/surface, walls or glass, posts/hoops, lighting), excluding the building
// ---------------------------------------------------------------------
const SPORTS = [
  { k: "basketball", name: "Basketball", icon: "🏀", court: [28, 15],    footprint: [32, 19],    ceiling: 7,   group: 30, range: "20–40", courtCost: 120000, color: "#ff7a1a",
    note: "Sprung wooden floor, 2 competition hoops + 4 side hoops, lighting, scoreboard." },
  { k: "squash",     name: "Squash",     icon: "🎾", court: [9.75, 6.4], footprint: [10.5, 7.2], ceiling: 6,   group: 5,  range: "4–6",   courtCost: 55000,  color: "#4da3ff",
    note: "4 walls (glass back wall), sprung maple floor, lighting." },
  { k: "badminton",  name: "Badminton",  icon: "🏸", court: [13.4, 6.1], footprint: [16.4, 9.1], ceiling: 9,   group: 8,  range: "6–12",  courtCost: 18000,  color: "#2ecc71",
    note: "Synthetic court mat, posts and net, glare-free lighting. Needs a 9 m ceiling." },
  { k: "padel",      name: "Padel",      icon: "🥎", court: [20, 10],    footprint: [21, 11],    ceiling: 7,   group: 4,  range: "4–6",   courtCost: 35000,  color: "#e0b0ff",
    note: "Glass-and-mesh enclosure, artificial turf, lighting." },
  { k: "pickleball", name: "Pickleball", icon: "🏓", court: [13.41, 6.1], footprint: [18.3, 9.1], ceiling: 5.5, group: 8,  range: "8–12",  courtCost: 12000,  color: "#ffd166",
    note: "Court surface or mat, net, line marking, lighting." },
];

// ---------------------------------------------------------------------
// Functional-fitness (circuit training) zone equipment
// ---------------------------------------------------------------------
const GYM_KIT = [
  ["Rig / squat racks with pull-up bars", "€6k–12k"],
  ["Olympic barbells + bumper plates", "€4k–8k"],
  ["Dumbbells (2.5–40 kg) + racks", "€3k–6k"],
  ["Kettlebells, wall balls, plyo boxes", "€2k–4k"],
  ["Rowers, air bikes, ski ergs", "€8k–15k"],
  ["Sled, battle ropes, bands, mats", "€1.5k–3k"],
  ["Rubber gym flooring (per m²)", "€35–60"],
  ["Sound system, mirrors, timer clock", "€2k–4k"],
];

// ---------------------------------------------------------------------
// Revenue streams catalogue  [name, typical price, in calculator?, description]
// ---------------------------------------------------------------------
const STREAMS = [
  { group: "Kids (the core business)", items: [
    ["Weekly kids coaching", "€50–90 / month", true, "Group sessions 2× a week by age group (8–11, 12–14, 15–18). Monthly subscription, paid by direct debit."],
    ["Holiday camps", "€150–250 / week", true, "Full-day camps in summer, Easter, half-term and Christmas holidays. High margin, and they use daytime court hours that would otherwise sit empty."],
    ["Private 1:1 & small-group coaching", "€35–60 / hour", true, "Skills, shooting and position-specific work for ambitious players."],
    ["Elite / development squads", "€90–150 / month", false, "Selective teams with extra training and tournaments. Higher fee, and they build the academy's reputation."],
    ["School partnerships (PE & after-school clubs)", "€40–70 / hour, paid by school", false, "Deliver PE lessons or after-school clubs at the school itself. Paid daytime work that also brings in new students."],
    ["Girls-only programmes", "Same as kids coaching", false, "Fewer providers offer these, and grant funders like them."],
    ["Birthday parties", "€180–300 / party", true, "Weekend basketball parties: a coach, games and a party area."],
  ]},
  { group: "Fitness zone (CrossFit-style circuit training)", items: [
    ["Functional fitness memberships", "€50–90 / month", true, "Circuit and strength classes using rigs, barbells, dumbbells, rowers and bikes. Mostly adults and parents."],
    ["Teen strength & conditioning", "€30–50 / month add-on", false, "Supervised, age-appropriate athletic training for players aged 14–18. Easy upsell to academy families."],
    ["Personal training", "€40–70 / session", false, "1:1 sessions in the fitness zone, often run by freelance trainers who pay rent or a revenue share."],
  ]},
  { group: "Adults", items: [
    ["Adult training sessions", "€35–60 / month", true, "Evening skills and fitness sessions for beginners, returners and parents."],
    ["Pickup games (drop-in)", "€5–10 / visit", true, "Open runs on fixed evenings. Little effort to run and they build a community."],
    ["Adult leagues (5×5 and 3×3)", "€300–600 / team / season", false, "Team entry fees for a season of games, plus referee fees."],
    ["Corporate team-building", "€400–1,500 / event", false, "Company events and office leagues. Good income during the day and on weeknights."],
    ["Parent & child sessions", "€10–15 / session", false, "Weekend family sessions that keep parents involved."],
  ]},
  { group: "Facility & events", items: [
    ["Court rental (hire to others)", "€40–80 / hour", true, "Rent out unused court hours to clubs, schools and groups."],
    ["Tournaments & showcase events", "€20–40 / player or €150+ / team", false, "Youth tournaments, 3×3 events and scouting showcases. Income from entry fees, tickets and stalls."],
    ["Coach education & certification", "€100–300 / participant", false, "Courses for parent-coaches, school PE teachers and junior coaches."],
    ["Video analysis & player reports", "€20–50 / report", false, "Filmed sessions, highlight reels and progress reports."],
  ]},
  { group: "Partnerships & products", items: [
    ["Local sponsorship", "€2k–20k / year per sponsor", true, "Kit, court banners and naming rights for local businesses."],
    ["Merchandise & kit", "30–50% margin", false, "Academy jerseys, hoodies and balls. Training kit can be built into the sign-up fee."],
    ["Online / at-home training", "€5–15 / month", false, "An app or video programme for practising at home. Earns money between sessions."],
    ["Café, vending & snacks", "Small but steady", false, "Parents wait during sessions, so even a vending machine earns money."],
    ["Brand & equipment partnerships", "Kit discounts + commission", false, "Official-supplier deals with sports brands, plus affiliate commission on shoes and gear."],
  ]},
  { group: "Funding (non-trading income)", items: [
    ["Grants (EU, national, city)", "€10k–400k per project", false, "Erasmus+ Sport, national sport capital grants and city youth funds. See the EU funding tab."],
    ["Free places paid for by councils or charities", "Per child", false, "Councils or charities pay for places for low-income kids. This fills spare capacity and makes grant applications stronger."],
  ]},
];

// ---------------------------------------------------------------------
// EU / national / private funding programmes (checked 14 Oct 2026)
// ---------------------------------------------------------------------
const FUNDS = [
  { name: "Erasmus+ Sport: Small-scale partnerships", type: "eu", amount: "€30,000 or €60,000",
    pts: ["Fixed lump sum: you choose €30k or €60k", "Runs 6–24 months", "At least 2 organisations from 2 different countries",
          "Aimed at grassroots work: youth participation, inclusion, girls in sport", "The 2026 deadline was 5 March 2026. Next round expected early 2027"] },
  { name: "Erasmus+ Sport: Cooperation partnerships", type: "eu", amount: "€120k / €250k / €400k",
    pts: ["Lump sum in one of 3 sizes", "Runs 12–36 months", "At least 3 organisations from 3 countries",
          "Suits bigger projects, e.g. a shared youth coaching method across academies in 3 cities"] },
  { name: "Erasmus+ Sport: Not-for-profit European sport events", type: "eu", amount: "up to ~€200k–€450k",
    pts: ["Local events ~€200k / €300k; Europe-wide events ~€450k", "Large-scale events €1–2M (needs partners from 15 countries)",
          "Could fund an international youth 3×3 tournament"] },
  { name: "Erasmus+: Mobility of sport staff", type: "eu", amount: "Travel + daily allowance per person",
    pts: ["Coaches train or job-shadow at clubs abroad (e.g. Spain, Lithuania, Serbia)", "Paid at fixed travel and daily rates",
          "A cheap way to raise your coaches' standard"] },
  { name: "European Regional Development Fund (ERDF)", type: "eu", amount: "Varies, often 40–85% of project cost",
    pts: ["Run by national or regional authorities, not Brussels", "Can fund sport facilities in urban regeneration projects",
          "Relevant once you build your own court or centre"] },
  { name: "European Social Fund Plus (ESF+)", type: "eu", amount: "Varies by country call",
    pts: ["Funds social inclusion and youth programmes for disadvantaged kids", "Applied for through national or regional calls",
          "Can pay for free places and outreach in low-income areas"] },
  { name: "InvestEU / EIF-backed microloans & SME loans", type: "eu", amount: "Loans, amount set by the local bank",
    pts: ["The EU guarantees loans that local banks give small businesses", "Easier approval and less collateral needed",
          "A loan, not a grant, so it fits the for-profit side of the academy"] },
  { name: "Ireland: Sports Capital & Equipment Programme", type: "nat", amount: "up to €200k local · €70k equipment",
    pts: ["Latest published caps (2023 round): €200k for local projects, €500k regional, €70k equipment-only",
          "Clubs without their own facility can still apply for equipment-only grants", "For non-profit clubs. Check the current round on the OSCAR portal"] },
  { name: "France: Agence nationale du Sport (ANS)", type: "nat", amount: "Typically €1k–€30k+ per club project",
    pts: ["Club grants paid through the basketball federation's annual sport project scheme (PSF)",
          "Priority for youth, girls and priority neighbourhoods (QPV)", "Separate grants for facilities"] },
  { name: "Spain, Germany, Italy & others: national and city sport grants", type: "nat", amount: "Varies",
    pts: ["Spain: CSD, regions and city councils (ayuntamientos)", "Germany: state (Land) and city funding for registered clubs (e.V.)",
          "Italy: Sport e Salute and regional calls", "Most cities have a youth sport fund. Ask the local sport department"] },
  { name: "Private: sponsors, foundations, brand programmes", type: "pri", amount: "€2k–€50k+",
    pts: ["Company and bank community funds, local community foundations",
          "Sports brands' grassroots programmes (kit and court refurbishments)", "Community programmes run by federations and pro clubs"] },
];

const FUND_SOURCES = [
  ["Erasmus+ Programme Guide: Sport (European Commission)", "https://erasmus-plus.ec.europa.eu/programme-guide/part-b/key-action-2/sport"],
  ["ERASMUS-SPORT-2026-SSCP small-scale partnerships (€30k / €60k)", "https://www.fundingprogrammesportal.gov.cy/en/call/small-scale-partnerships-en-2025/"],
  ["Cooperation partnerships lump sums (€120k / €250k / €400k)", "https://www.confindustria.it/en/?p=21716"],
  ["Erasmus+ sport grants summary (event amounts, durations, 2026 deadline)", "https://sporbilimleri.gelisim.edu.tr/en/akademik-news-erasmus-grants-in-the-field-of-sports"],
  ["Ireland Sports Capital & Equipment Programme (latest published caps)", "https://www.fai.ie/domestic/facilities/sports-capital-and-equipment-programme-2023"],
  ["EU Funding & Tenders portal (open calls)", "https://ec.europa.eu/info/funding-tenders/opportunities/portal/"],
];

// ---------------------------------------------------------------------
// City scoring
// ---------------------------------------------------------------------
const FACTORS = [
  { k: "density",  label: "Population density",         w: 20, why: "More people within walking distance of one academy" },
  { k: "youth",    label: "Share of kids aged 8–18",    w: 20, why: "More potential students per resident" },
  { k: "schools",  label: "Near schools",               w: 15, why: "Kids come straight from school; recruitment and partnerships" },
  { k: "resid",    label: "Residential / family areas", w: 15, why: "Families live close by, so trips are short" },
  { k: "interest", label: "Basketball interest",        w: 10, why: "How popular basketball already is" },
  { k: "gap",      label: "Supply gap (few academies)", w: 10, why: "Demand that isn't met yet: waiting lists, few clubs" },
  { k: "pay",      label: "Ability to pay",             w: 5,  why: "Household income to afford monthly fees" },
  { k: "cost",     label: "Low operating cost",         w: 5,  why: "Cheaper rent and salaries (10 = cheapest)" },
];

//  name, country, density, youth, schools, resid, interest, gap, pay, cost, why
const CITY_DATA = [
  ["Paris",     "France",      10, 7, 9, 7, 8, 5, 8, 3, "Very dense, with many schools in every arrondissement and one of the youngest populations in the EU. Interest in basketball is rising fast (the Wembanyama effect, Olympic silver in 2024). Rent is high, so hire municipal gyms by the hour."],
  ["Dublin",    "Ireland",      5,10, 7, 8, 5, 9, 9, 3, "Ireland has the highest share of children in the EU. Youth basketball is growing but there are few indoor courts, and clubs have waiting lists. High incomes support premium fees, and it's English-speaking, so easy to start."],
  ["Barcelona", "Spain",        9, 5, 8, 7, 9, 3, 6, 5, "Very dense family neighbourhoods and a strong basketball culture (Barça, Joventut). Lots of competition, so stand out on coaching quality and English-language sessions."],
  ["Athens",    "Greece",       9, 4, 8, 6, 9, 3, 4, 8, "Basketball is close to the national sport, there are dense residential areas and costs are low. Lower incomes cap fees, so it suits high volume and camps more than premium pricing."],
  ["Madrid",    "Spain",        6, 5, 8, 8, 9, 3, 6, 6, "Large family suburbs and a strong school-club basketball culture (Real Madrid, Estudiantes). The market is mature, so compete on modern coaching and flexible schedules."],
  ["Amsterdam", "Netherlands",  6, 6, 7, 6, 5, 7, 9, 3, "High incomes, an international community and a clear shortage of basketball clubs. Halls are expensive and scarce."],
  ["Berlin",    "Germany",      5, 5, 7, 7, 7, 6, 7, 6, "Germany's 2023 World Cup win boosted interest. ALBA Berlin's youth programmes show the demand, and costs are moderate."],
  ["Munich",    "Germany",      5, 5, 7, 7, 6, 6, 9, 3, "Wealthy families and the rise of FC Bayern Basketball. Costs are very high and hall time is scarce."],
  ["Milan",     "Italy",        7, 4, 7, 6, 7, 5, 7, 4, "A dense city with Olimpia Milano's tradition, but an older population means fewer kids."],
  ["Warsaw",    "Poland",       4, 6, 6, 7, 6, 7, 5, 8, "Fast-growing, with young families and low costs. There's room for a quality academy."],
  ["Lisbon",    "Portugal",     6, 4, 6, 6, 5, 7, 5, 6, "A growing number of expat families and few competitors, but basketball is a small sport there."],
  ["Vilnius",   "Lithuania",    2, 6, 4, 5,10, 2, 4, 8, "Basketball is the national religion, but the city is small and spread out, and it's already full of strong clubs."],
];

// ---------------------------------------------------------------------
// Every parameter / requirement the owner has asked for so far,
// de-duplicated. [requirement, where it lives on the site]
// ---------------------------------------------------------------------
const PARAMS = [
  { group: "Website & hosting", items: [
    ["A real website (not a document) with cards that show the key numbers", "Whole site"],
    ["Code and site hosted online on GitHub, nothing kept on a local machine, editable from anywhere", "GitHub repo + GitHub Pages"],
    ["Tabs to move between sections", "Top navigation"],
    ["An About / introduction section first", "About"],
    ["A pitch deck that shows the whole plan clearly", "Deck"],
    ["A list of every parameter asked for, with duplicates removed", "Parameters (this tab)"],
  ]},
  { group: "Calculator: levers (sliders)", items: [
    ["Several levers, and every card updates as you move them", "Calculator"],
    ["Number of academies (start with 1, then 2, 3 …)", "Calculator: lever"],
    ["Occupancy (% of capacity filled)", "Calculator: lever"],
    ["Price charged to students (monthly fee)", "Calculator: lever"],
    ["Cost to acquire a student (CAC)", "Calculator: lever"],
    ["Students per coach on one court (20–40)", "Calculator: lever"],
  ]},
  { group: "Calculator: metrics shown on cards", items: [
    ["Total investment needed (how much money is needed)", "Calculator + About + Deck"],
    ["Total cost to set up the academy", "Calculator: investment breakdown"],
    ["Total area / space (m²)", "Calculator: area cards and area bar"],
    ["Running costs, revenue, profit, break-even, and every other metric needed to start the business", "Calculator: cards"],
  ]},
  { group: "Business model", items: [
    ["Start with one basketball academy", "Calculator default"],
    ["A CrossFit-style circuit-training zone on the side (machines, dumbbells, bars)", "Calculator: fitness zone levers + kit list"],
    ["Target age group: kids 8–18 (first said 7, then corrected to 8–18)", "About, Calculator, Cities"],
    ["Every possible revenue stream: pickup games, adult training, kids coaching and more", "Revenue streams"],
  ]},
  { group: "Why basketball", items: [
    ["A tab that justifies choosing basketball over other academy sports", "Why basketball"],
    ["One court with one coach engages 20–40 students", "Why basketball"],
    ["Area, investment and investment per area for squash, badminton, padel and pickleball, each in its own panel", "Why basketball: sport panels"],
    ["A clear visual showing how much space each sport needs", "Why basketball: to-scale floor plans"],
  ]},
  { group: "Funding", items: [
    ["What EU funding is available", "EU funding"],
    ["How much funding there is", "EU funding: amounts + totals"],
  ]},
  { group: "Location", items: [
    ["Top 5 cities across the EU, and why", "Best cities"],
    ["Show the parameters used to pick them", "Best cities: factor sliders + table"],
    ["Parameter: population density", "Best cities"],
    ["Parameter: near schools", "Best cities"],
    ["Parameter: near residential areas", "Best cities"],
  ]},
];

// Things asked for more than once; each is kept only once in PARAMS above.
const DUPLICATES = [
  "“Create a new website / basketball academy planner” (asked twice; it's the same site)",
  "“Total investment needed” = “how much it will cost” = “the money that is needed”",
  "“Cards” and “cards with labels”",
  "“Levers” (asked in three messages)",
  "“Occupancy” (listed twice in the same message)",
  "“Price charged” = “how much are we going to charge the students”",
  "“One basketball academy, two…” and “let's begin with one basketball academy”",
  "“Space” = “total area”",
  "“Kids coaching centres” = the core kids coaching stream",
  "“Area required” = “how much area it is showing up”",
];
