# 🏀 Basketball Academy Planner

Interactive planner for a network of youth basketball academies (ages 8–18) with a
CrossFit-style functional-fitness zone, across the European Union.

**Live site:** https://anuroopbs.github.io/basketball-academy-planner/

## Tabs

| Tab | What it shows |
|---|---|
| About | The concept and headline numbers |
| Calculator | 12 levers (academies, occupancy, fee, kids per coach, cost to acquire a student, fitness zone…) → area, investment, capacity, P&L, break-even occupancy, unit economics |
| Deck | 12-slide pitch deck built from the live calculator numbers (full-screen mode) |
| Why basketball | Same floor space, 5 sports (basketball, squash, badminton, padel, pickleball), drawn to scale: kids per coach, area, investment per m² and per kid |
| Revenue streams | Every possible revenue stream with typical prices |
| EU funding | Erasmus+ Sport, ERDF, ESF+, InvestEU and national schemes, with amounts and sources |
| Best cities | Top 5 EU cities, with adjustable factor weights (population density, schools, residential areas…) |
| Parameters | Every requirement asked for so far, with duplicates removed |

## Editing

Plain HTML/CSS/JS, no build step. You can edit straight on GitHub (press `.` in the repo to open the web editor),
and GitHub Pages redeploys automatically within a minute or so.

- `index.html`: page structure and the text of each tab
- `assets/data.js`: all numbers and content (sports, revenue streams, funding, cities, parameters)
- `assets/app.js`: the calculator, charts and deck logic
- `assets/styles.css`: styling

All figures are estimates. Check them against local quotes before making decisions.
