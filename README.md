# Shelfwise · Library Management System (backend)

**Live API:** https://library-management-system-backend-six.vercel.app  
**Live site:** https://library-management-system-frontend-ten-chi.vercel.app

REST API for **Shelfwise**, a library management system: a book catalogue, borrowing and returning, readers and librarians. Built with **Express 5**, **TypeScript** and **MongoDB (Mongoose)**. The site that uses it is [library-management-system-frontend](https://github.com/rudraprotapchakraborty/library-management-system-frontend).

It grew out of a small assignment API (books + borrow summary). The original rules are kept; sign-in, roles and a reader's own loans were added around them.

## What it does

- **Books** – create, read, update, delete. Listing supports `filter` (genre), `sortBy`, `sort` (`asc`/`desc`) and `limit` as before, plus `q` (title, author or ISBN), `available=true` and `page`.
- **Availability rule** – a book with no copies left is unavailable; this is enforced by a model method and a `save` hook.
- **Borrowing** – `POST /api/borrow` checks the book exists and has enough copies, takes the copies off the shelf and records a loan with a due date.
- **Returning** – `POST /api/borrow/:id/return` puts the copies back and makes the book available again.
- **Borrow summary** – the original aggregation (total copies borrowed per book) for librarians.
- **Accounts** – email + one-time code, password reset, Google sign-in, profile photo, email/password change, delete account.
- **Roles** – `ADMIN` (librarian) manages books, sees every loan and manages readers; `USER` (reader) browses, borrows and returns. Admins can block readers; the last admin cannot demote themselves.
- **Safety** – Helmet, CORS allow-list, rate limiting, Zod validation on every write, JWT sessions, demo accounts locked down.

## API

| Method & path | Who | Purpose |
| --- | --- | --- |
| `GET /api/books` | public | List / search books |
| `GET /api/books/:bookId` | public | One book |
| `POST /api/books` | librarian | Add a book |
| `PUT /api/books/:bookId` | librarian | Update a book |
| `DELETE /api/books/:bookId` | librarian | Delete a book (blocked while copies are on loan) |
| `POST /api/borrow` | signed in | Borrow `{ book, quantity, dueDate }` |
| `GET /api/borrow/mine` | signed in | My loans |
| `POST /api/borrow/:id/return` | signed in | Return a loan |
| `GET /api/borrow` | librarian | Borrowed books summary |
| `GET /api/borrow/active` | librarian | Every loan still out |
| `GET /api/dashboard/summary` | signed in | My numbers |
| `GET /api/admin/stats`, `GET/PATCH/DELETE /api/admin/users` | librarian | Library numbers, manage readers |
| `GET /api/public/stats` | public | Counts for the landing page |
| `/api/auth/*`, `/api/users/*`, `/api/uploads/*` | mixed | Sign-in, account, photo upload |

Responses look like `{ success, message, data }`.

## Getting started

```bash
npm install
cp .env.example .env     # fill in the values
npm run seed             # 28 Wikipedia books, 5 demo accounts, sample loans
npm run dev              # http://localhost:5000
```

Build for production: `npm run build && npm start`. Deployed on Vercel through `api/index.ts`. On Vercel set every variable below; `CLIENT_URL` must include the live site (https://library-management-system-frontend-ten-chi.vercel.app).

### Environment (`.env`, git-ignored)

`PORT`, `MONGODB_URI`, `MONGODB_DB` (own database, default `shelfwise_library`), `JWT_ACCESS_SECRET`, `CLIENT_URL` (allowed browser origins), `GOOGLE_CLIENT_ID`, `SMTP_*` / `MAIL_FROM` or `RESEND_API_KEY` (one-time codes), `IMGBB_API_KEY` (profile photos). See `.env.example`.

### Demo accounts (`npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Librarian | `admin@shelfwise.demo` | `ShelfDemo#2026` |
| Reader | `reader@shelfwise.demo` | `ShelfDemo#2026` |

Book descriptions and cover images come from Wikipedia (CC BY-SA); ISBNs are generated for the demo. `npm run seed:clear` removes the demo data again.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck` · `npm run seed` · `npm run seed:clear`
