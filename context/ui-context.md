# UI Context

## Theme

The app uses a light theme only in v1. It should look like a professional internal
tool: data-dense, calm and neutral. Surfaces are white on a soft grey canvas with thin
borders. One restrained blue accent marks interactive and primary elements. Colour is
used for meaning (state, chart series) and never for decoration. Numbers are
first-class: tabular figures, right-aligned, with the currency code visible.

## Colors

All components use these tokens, defined in `app/globals.css` on `:root`. shadcn
variables (`--background`, `--foreground`, `--primary`, `--border`, `--ring`, and so
on) are mapped onto these tokens, never set to separate values. Project token names
deliberately avoid shadcn's names. For example, shadcn's `--accent-foreground` is
the text colour on a hover background, not the text colour on the blue accent. In
components, use the Tailwind classes generated from the shadcn names (`bg-primary`,
`text-muted-foreground`, `border-border`, `bg-success`, `bg-warning`). Do not
hardcode hex values in components.

| Role               | CSS Variable           | Value     |
| ------------------ | ---------------------- | --------- |
| Page background    | `--bg-base`            | `#F7F8FA` |
| Surface (cards)    | `--bg-surface`         | `#FFFFFF` |
| Subtle surface     | `--bg-subtle`          | `#F1F3F6` |
| Primary text       | `--text-primary`       | `#111827` |
| Muted text         | `--text-muted`         | `#6B7280` |
| Primary accent     | `--accent-primary`     | `#2563EB` |
| Accent hover       | `--accent-primary-hover` | `#1D4ED8` |
| Text on accent     | `--accent-foreground-on-primary` | `#FFFFFF` |
| Border             | `--border-default`     | `#E5E7EB` |
| Focus ring         | `--focus-ring`         | `#93C5FD` |
| Error              | `--state-error`        | `#DC2626` |
| Warning            | `--state-warning`      | `#D97706` |
| Success            | `--state-success`      | `#16A34A` |
| Chart series 1–5   | `--chart-1` … `--chart-5` | `#2563EB`, `#0891B2`, `#7C3AED`, `#DB2777`, `#EA580C` |

Text contrast must meet WCAG AA. Muted text on the surface colour is 4.8:1.

## Typography

| Role      | Font       | Variable      |
| --------- | ---------- | ------------- |
| UI text   | Geist Sans | `--font-sans` |
| Code/mono | Geist Mono | `--font-mono` |

- Fonts are loaded with `next/font`. The base size is 14px (`text-sm`) for tables and
  forms. Page titles use `text-xl font-semibold`, and card titles use
  `text-sm font-medium` in muted text.
- Numeric table cells and axis ticks use `tabular-nums`. Large standalone figures
  (stat tiles) use proportional figures, because `tabular-nums` looks loose at display
  sizes. Employee codes use the mono font.

## Border Radius

| Context                           | Class        |
| --------------------------------- | ------------ |
| Inline / small UI (badges, inputs, buttons) | `rounded-md` |
| Cards / panels / tables           | `rounded-lg` |
| Modals / sheets / popovers        | `rounded-xl` |

## Component Library

The app uses shadcn/ui on top of Tailwind. The primitives live in `components/ui/` and
are **protected**: add them with `npx shadcn add <name>` and do not hand-edit them.
Compose them in feature components instead.

- **Installed so far:** button, input, label, native-select, table, sheet, card,
  badge, skeleton, switch, separator, sonner and alert-dialog.
- **Not needed:** tabs. The Insights group switch is a set of URL links, so the
  view can be linked and the back button works.
- **The job title field is an `<input>` with a `<datalist>`**, not a command+popover
  combobox (AD-33). It suggests the titles in use and still accepts a new one.
- **Filters use `native-select`, not the Radix `select`.** A native `<select>` gives
  full keyboard and screen reader support and the platform picker on mobile. It is
  also testable in jsdom with `fireEvent.change`.
- **Pagination is the shared `components/common/pagination.tsx`**, built from Button
  and Link rather than shadcn's pagination block, so every control is a plain link
  (canonical URL, works without JS, prefetched). See "Pagination" under Layout
  Patterns.
- **The `sonner` wrapper follows `next-themes`.** The app is light-only, so render
  `<Toaster theme="light" />` instead of editing the protected file.

Charts use Recharts, wrapped in `components/insights/*`, and take colours from the
`--chart-*` tokens.

## Layout Patterns

- **App shell:** A fixed left sidebar (240px, `--bg-surface`, right border) holds the
  logo, the Employees and Insights nav, and the user menu with sign out at the bottom.
  The main area scrolls, with `max-w-screen-2xl` and `p-6`. Below 1024px the sidebar
  collapses into a sheet opened from a top-bar menu button.
- **Data table page (Employees):** The page header has the title, a count and an
  "Add employee" primary button on the right. A toolbar holds the search input
  (debounced 300ms), filter selects for country, department and title, and a "Show
  terminated" toggle. Next comes a table inside a card, with a sticky header and
  sortable column headers that show a direction icon. The footer holds the shared
  pagination. A row's name links to the employee detail.
- **Pagination** (directory and salary history):
  - The left side reads "Showing **301–350** of **10,000** employees", followed by
    a "Rows per page" select (25 / 50 / 100, directory only).
  - The right side is the page navigation: `« ‹ 1 … 6 [7] 8 … 200 › »`.
    - There are always 7 number slots (first, last, current ± 1, and ellipses only
      when they hide at least 2 pages), so the control never changes width while
      paging.
    - The current page is a filled button with `aria-current="page"`. Ellipses are
      `aria-hidden`. Icon buttons have labels. Disabled ends render as disabled
      buttons, not dead links.
  - "Go to page" appears at `lg` and wider when there are more than 7 pages. Input
    is clamped to the valid range; native validation is off so the clamp, not a
    browser bubble, handles "500".
  - Below `sm`, the number strip collapses to "Page 7 of 200" between ‹ and ›.
  - A page past the end offers "Go to the last page".
  - A single page shows only the summary.
- **Form (create/edit):** A right-side Sheet (480px) holds a single-column form with
  labels above the fields. Errors appear inline under each field, using the same Zod
  schema as the API. The salary input is in major units, with the currency shown as a
  suffix that follows the selected country. Editing a salary shows an optional
  "Reason for change" field. Sticky footer buttons are Cancel and Save. Terminating an
  employee is confirmed in an AlertDialog.
- **Employee detail:** A header card holds the name, code, title, department, country
  and the current salary in local currency plus USD. Below it, the Salary history
  table shows date, old, new, change %, reason and changed-by, newest first.
- **Dashboard (Insights):**
  - One filter row (country, department, title) sits above everything and scopes
    every stat and chart. "Clear filters" appears when any filter is set.
  - A KPI row of 4 stat tiles shows Headcount, Median, Average, and the salary
    range, in USD.
  - A two-column grid (at `xl` and wider) holds two cards:
    - "Median salary by…", with a segmented control (Country / Department / Job
      title), which is a set of links, not Radix Tabs. It shows a horizontal bar
      chart of the median, with a stats table (headcount, min, median, avg, max)
      always visible below it.
    - "Headcount by country", a horizontal bar chart.
  - A full-width salary distribution histogram comes next.
  - The footer note reads "Active employees only. USD at FX version {version}
    ({date})".
- **Charts** follow the dataviz method:
  - **Color:** one hue (`--chart-1`, validated: passes lightness, chroma and ≥ 3:1
    contrast on the white surface) for every bar, because the categories are
    nominal. There is no categorical palette and no color legend for a single
    series. Text never uses the chart hue.
  - **Marks:** bars at most 24 px, with a 4 px rounded data end, square at the
    baseline. Gridlines are solid hairlines. Marks are styled through CSS
    (`ChartFrame`), because SVG presentation attributes can't read CSS variables.
  - **Interaction:** a tooltip in which the value leads and the category follows.
    The Recharts `accessibilityLayer` gives keyboard focus the same tooltip.
  - **Table view:** every chart has one. The "Salary by" stats table is always
    visible; the other two use a native `<details>` "View as table".
  - **Refetch:** filter changes run in a transition, so the previous render stays
    on screen with a spinner. There is no skeleton flash.

## States

- **Loading:** Use Skeletons that match the final layout: table rows, stat cards and
  chart boxes. Do not use full-page spinners. Buttons show an inline spinner and are
  disabled while submitting.
- **Empty:** A centered icon, a one-line explanation and one action. Examples: "No
  employees match these filters" with "Clear filters", and "No salary changes yet".
  Charts with no data show the same message inside the chart card.
- **Error:** A route-level `error.tsx` shows a card with a short message and "Try
  again". Mutation failures show a toast and keep the form's input. Field validation
  errors appear inline. Users never see raw error codes or stack traces.
- **Success:** A toast confirms each mutation, for example "Employee updated".

## Icons

Use Lucide React stroke icons only. Sizes are `h-4 w-4` inline and in buttons, and
`h-5 w-5` in nav items. The empty-state illustration icon is `h-8 w-8` in muted text.
Icon-only buttons need an `aria-label`.
