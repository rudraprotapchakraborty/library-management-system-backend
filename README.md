# 📚 Library Management API

A full‑featured **Library Management System** built with **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

## ✨ Features

- Book & Borrow models with schema validation
- Business logic to control availability when borrowing
- Aggregation pipeline for borrow summary
- Mongoose instance method & middleware
- Filtering, sorting & pagination support
- Centralized error handling with consistent API responses
- Clean, modular folder structure
- Ready‑to‑run with `ts-node-dev` for development & `build` for production

## 🚀 Quick Start

```bash
# 1. Clone & install
npm install

# 2. Copy env & set Mongo URI
cp .env
# Edit .env with your Mongo connection string

# 3. Run in dev mode
npm run dev

# 4. Build & serve
npm run build
npm start
```

The server starts on **http://localhost:5000** by default.

## 🛣️ API Endpoints

- `POST /api/books` – Create a book  
- `GET /api/books` – Get all books (`filter`, `sortBy`, `sort`, `limit`)  
- `GET /api/books/:bookId` – Get a single book  
- `PUT /api/books/:bookId` – Update a book  
- `DELETE /api/books/:bookId` – Delete a book  
- `POST /api/borrow` – Borrow a book  
- `GET /api/borrow` – Borrowed books summary (aggregation)

---

Made with ❤️ & TypeScript. Happy coding!
