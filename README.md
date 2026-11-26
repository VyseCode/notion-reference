# Notion-ref — Notion-inspired reference implementation

This is a **reference implementation inspired by Notion**. It is an independent learning project built with Next.js 16 (App Router), React 19, Tailwind CSS 4, MongoDB, and Mongoose. It is not affiliated with or endorsed by Notion.

## Features

- **Auth** — register, login, logout, and current-user endpoints. Bcrypt password hashing, signed JWTs in HTTP-only cookies.
- **Nested pages** — a page tree via `parentId`, with create, rename, delete (recursive), move (cycle-safe), favorite, icon/emoji, cover color, and breadcrumbs.
- **Block editor** — paragraph, heading 1/2/3, bullet, numbered, to-do, quote, code, divider, and image blocks. Add, update, delete, reorder, and toggle to-dos with an inline block toolbar.
- **Sharing** — private pages by default; publish any page to a stable public slug with a read-only public view.
- **Search** — full-text-ish search across page titles and block content, with snippets.
- **Workspace home** — recently updated pages and favorites; a collapsible sidebar page tree with favorites and inline filtering.
- **Responsive UI** — a Notion-like layout with a slide-over sidebar on mobile and a focused editor canvas.

## Scalability notes

- One cached Mongoose connection with a bounded connection pool.
- `.lean()` queries with explicit projections; passwords are never selected by default.
- Unique compound/single indexes enforce one account per email, one slug per page, and ordered blocks per page.
- Every list endpoint is paginated via `limit` / `offset`.
- Page deletion recursively removes descendant pages and their blocks in bounded batches.

## Local setup

1. Install dependencies: `npm install`
2. Start MongoDB on `127.0.0.1:27017` (or set `MONGODB_URI`)
3. Copy `.env.example` to `.env.local` and set a long random `JWT_SECRET`
4. Seed demo data: `npm run seed`
5. Run the app: `npm run dev` (serves on port **3202**)

Open <http://localhost:3202>.

### Demo accounts

| Email | Password | Notes |
| --- | --- | --- |
| `alex@example.com` | `password123` | Owner of the seeded workspace, including published pages |
| `priya@example.com` | `password123` | Separate workspace, to verify per-user isolation |

Published public pages: `/p/getting-started` and `/p/product-roadmap`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run seed
```

## API

All endpoints except auth/login, auth/register, and public read require the session cookie. List endpoints accept `limit` (1–100) and `offset`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/pages` | List pages (`parentId` filter) / create page |
| GET / PATCH / DELETE | `/api/pages/[id]` | Page detail / update / recursive delete |
| GET / POST / PUT | `/api/pages/[id]/blocks` | List / add / reorder blocks |
| PATCH / DELETE | `/api/pages/[id]/blocks/[blockId]` | Update / delete block |
| GET | `/api/search?q=` | Search titles and block text |
| GET | `/api/favorites` | Favorite pages |
| GET | `/api/recent` | Recently updated pages |
| GET | `/api/public/[slug]` | Published page and its blocks |

## Pages

| Route | Description |
| --- | --- |
| `/` | Redirects to `/home` |
| `/home` | Workspace dashboard |
| `/doc/[id]` | Block editor |
| `/search?q=` | Search results |
| `/p/[slug]` | Public read-only page |
| `/login`, `/register` | Authentication |
