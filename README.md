# TED Browser App

A responsive Angular 19 web application for browsing, searching, and exploring TED Talks. Find talks by keyword, filter by topic category, page through results, and view full details including speaker info and a direct link to watch on TED.com.

## Features

- **Keyword search** — find talks by title or topic
- **Category filter** — narrow results by Technology, Entertainment, Design, Science, or Business
- **Paginated results grid** — 10 talks per page with thumbnails and titles
- **Talk detail page** — description, speaker name, publish date, and direct watch link to TED.com
- **Live search via Algolia** — powered by TED's own Algolia search backend (`zenith-prod-alt.ted.com`)
- **Offline fallback** — 25 curated TED classic talks displayed when the API is unavailable
- **Responsive UI** — works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 19 (standalone components) |
| Language | TypeScript |
| Styling | SCSS |
| HTTP | Angular `HttpClient` |
| Search API | TED / Algolia (`zenith-prod-alt.ted.com/api/search`) |
| Routing | Angular Router |

## Getting Started

### Prerequisites

- Node.js **18.19 or newer** (Angular 19 requirement)
- npm

### Installation

```bash
npm install
```

### Development server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   └── video.model.ts        # TedVideo and SearchResponse interfaces
│   │   └── services/
│   │       └── ted.service.ts        # Algolia search + fallback data
│   ├── features/
│   │   ├── search/
│   │   │   └── search-page.component # Main search page (keyword + category + grid)
│   │   └── detail/
│   │       └── video-detail.component # Talk detail page
│   └── shared/
│       └── components/
│           └── pagination/
│               └── pagination.component # Reusable pagination UI
├── styles.scss                         # Global styles
└── index.html
```

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `SearchPageComponent` | Search & browse talks |
| `/video/:id` | `VideoDetailComponent` | Talk detail view |

## Data Source

Search is powered by TED's Algolia endpoint:

```
POST https://zenith-prod-alt.ted.com/api/search
```

Category filters map UI labels to Algolia topic tags (e.g. *Technology* → `technology, innovation, internet, computers, ai`).

When the API is unreachable, a built-in set of 25 classic TED Talks across all five categories is displayed automatically.

- `src/app/core/services/ted.service.ts` - TED feed search and mapping logic
