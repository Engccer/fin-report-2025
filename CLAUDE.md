# CLAUDE.md - 장교조 재정 관리 웹앱

This document provides guidance for AI assistants working with this codebase.

## Project Overview

**Purpose:** Financial management web application for the Korean Teachers Union for Disabled Teachers (장교조 - Jang Gyo Jo)

**Features:**
- Monthly financial report visualization (income/expenses)
- Budget vs. actual spending comparison
- Trend analysis with charts
- Budget planning and drafting tool
- Full-text search across financial records

**Tech Stack:**
- Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3
- Charts: Chart.js (via CDN)
- Build: Node.js script
- Deployment: Vercel (static hosting)
- Language: Korean UI

## Project Structure

```
fin-report-2025/
├── app/                          # Web application (deployed)
│   ├── index.html               # Single entry point
│   ├── css/style.css            # All styling (724 lines)
│   ├── js/
│   │   ├── app.js               # Main application controller
│   │   ├── utils/
│   │   │   ├── format.js        # Currency/date formatting
│   │   │   └── keyboard.js      # Keyboard shortcuts & navigation
│   │   └── views/               # Feature modules
│   │       ├── dashboard.js     # Summary statistics
│   │       ├── monthly.js       # Monthly report viewer
│   │       ├── budget.js        # Budget vs. actual comparison
│   │       ├── trends.js        # Trend charts (Chart.js)
│   │       ├── planner.js       # Budget drafting tool
│   │       └── search.js        # Full-text search
│   └── data/
│       ├── reports.json         # Generated monthly reports
│       └── budget.json          # Generated budget data
│
├── monthly-reports/             # Source: Monthly financial reports (TXT)
├── budget-closing/              # Source: Budget/settlement files (CSV)
├── build.js                     # ETL script: TXT/CSV → JSON
├── build.bat                    # Windows build wrapper
└── vercel.json                  # Deployment configuration
```

## Key Commands

```bash
# Build data files (converts TXT/CSV sources to JSON)
node build.js

# Windows alternative
build.bat

# The app is static HTML - open directly or use any local server
# Example with Python:
cd app && python -m http.server 8000
```

## Data Flow

```
Source Files                    Build Process              Application
─────────────────              ─────────────              ───────────────
monthly-reports/*.txt    ──┐
                           ├──> node build.js ──> app/data/reports.json ──┐
budget-closing/*.csv     ──┘                  ──> app/data/budget.json  ──┼──> app.js ──> Views
```

**Build script (`build.js`):**
- Parses Korean markdown-formatted monthly reports
- Parses CSV budget/settlement files
- Handles UTF-8 encoding with BOM removal
- Outputs structured JSON for the frontend

## Architecture Patterns

### Module Pattern
Each view is a singleton object:
```javascript
const Dashboard = {
  render(data) { /* ... */ },
  calculateYearStats(reports) { /* ... */ }
}
```

### Application Flow
1. `app.js` loads JSON data via fetch
2. Navigation events trigger view switches
3. Views render to DOM using template strings
4. No framework - pure DOM manipulation

### State Management
- `App.data` holds loaded JSON (reports, budget)
- `App.currentView` tracks active view
- Views maintain local state (e.g., `Monthly.selectedMonth`)
- `Planner` uses localStorage for draft persistence

## Code Conventions

### Naming
- **Variables/Functions:** camelCase (`formatCurrency`, `selectedMonth`)
- **Objects/Classes:** PascalCase (`Dashboard`, `Monthly`, `Keyboard`)
- **CSS Classes:** kebab-case (`.stat-card`, `.month-selector`)
- **IDs:** kebab-case with prefixes (`#view-dashboard`, `#main-content`)

### File Organization
- One view per file in `app/js/views/`
- Utilities in `app/js/utils/`
- All styles in single `style.css` using CSS custom properties

### CSS Variables (Design System)
```css
--color-primary: #2563eb;    /* Blue - primary actions */
--color-income: #059669;     /* Green - income displays */
--color-expense: #dc2626;    /* Red - expense displays */
--color-balance: #2563eb;    /* Blue - balance displays */
--color-warning: #f59e0b;    /* Amber - warnings */
```

## Accessibility Features

The app prioritizes accessibility:
- Semantic HTML5 (header, nav, main, section)
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Arrow keys)
- Keyboard shortcuts (1-5 for views, Ctrl+K for search, ? for help)
- `.sr-only` class for screen reader content
- Skip links for keyboard users
- Focus visible styles
- Table captions and proper headers

## Important Files to Know

| File | Purpose |
|------|---------|
| `app/js/app.js` | Entry point, data loading, navigation |
| `app/js/views/planner.js` | Largest view (418 lines), budget drafting |
| `build.js` | Data transformation (518 lines), critical for updates |
| `app/css/style.css` | All styling, CSS variables at top |
| `vercel.json` | Deployment config, points to `/app` |

## Working with Data

### Adding Monthly Reports
1. Add TXT file to `monthly-reports/` with format:
   ```
   # 2025년 X월 함께하는장애인교원노동조합 재정 보고서

   ## 요약
   - 전월이월금: X원
   - 당월수입: X원
   ...
   ```
2. Run `node build.js`
3. Data appears in `app/data/reports.json`

### Modifying Budget Data
1. Edit CSV files in `budget-closing/`
2. Run `node build.js`
3. Data appears in `app/data/budget.json`

## Common Tasks

### Adding a New View
1. Create `app/js/views/newview.js` with render method
2. Add script tag in `index.html`
3. Add navigation link in `index.html`
4. Register in `app.js` navigate/renderView methods

### Modifying Styles
- All styles in `app/css/style.css`
- CSS variables defined at `:root` for theming
- Mobile responsive breakpoints already defined

### Updating Chart Visualizations
- Charts are in `app/js/views/trends.js`
- Uses Chart.js library (loaded via CDN)
- Charts are destroyed and recreated on view change

## Deployment

**Platform:** Vercel (automatic from git push)
**Process:**
1. Run `node build.js` to generate JSON data
2. Commit changes including generated `app/data/*.json`
3. Push to repository
4. Vercel deploys `/app` directory as static site

## Testing

**Current Status:** No automated tests
- Manual testing only
- Test views by opening `app/index.html` locally

## Language & Encoding

- **UI Language:** Korean (한국어)
- **Encoding:** UTF-8
- **Build script:** Handles BOM removal for Windows-created files
- **Currency:** Korean Won (원), formatted with thousands separators

## Tips for AI Assistants

1. **Always run `node build.js`** after modifying source data files
2. **Check encoding** - Korean text must be UTF-8
3. **Version parameter** - Update `?v=X` in index.html script tags when caching issues occur
4. **No package.json** - This project has no npm dependencies (except dev-time Node.js for build)
5. **Test locally** - Open `app/index.html` in browser to verify changes
6. **Preserve accessibility** - Maintain ARIA labels and semantic HTML when editing
7. **Format currency correctly** - Use `formatCurrency()` from `utils/format.js`
8. **Keyboard shortcuts** - Document any new shortcuts in `utils/keyboard.js`
