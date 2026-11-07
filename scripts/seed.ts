/**
 * Fills the Library database with a sample catalogue and demo accounts.
 *
 *   npm run seed          create / refresh the demo data
 *   npm run seed:clear    remove it again
 *
 * The catalogue comes from scripts/books.seed.json: 28 classics with descriptions and free-licensed
 * cover images from Wikipedia (CC BY-SA). ISBNs are generated for the demo and are not real.
 * Only accounts flagged `isDemo` (and the loans that belong to them), plus the sample books
 * themselves, are ever touched, so real readers and the books a librarian adds are never affected.
 * Safe to run repeatedly: the demo data is reset each time.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connectDB, disconnectDB } from "../src/config/db";
import { env } from "../src/config/env";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/config/demo";
import { hashPassword } from "../src/utils/password";
import { User } from "../src/models/User";
import { Book } from "../src/models/Book";
import { Borrow } from "../src/models/Borrow";

const books: any[] = JSON.parse(readFileSync(join(__dirname, "books.seed.json"), "utf8"));

const portrait = (g: "men" | "women", n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const day = 24 * 60 * 60 * 1000;

const people: { key: string; email: string; fullName: string; role: "ADMIN" | "USER"; image: string }[] = [
  { key: "admin", email: DEMO_ACCOUNTS[0].email, fullName: "Ruth Calloway", role: "ADMIN", image: portrait("women", 68) },
  { key: "reader", email: DEMO_ACCOUNTS[1].email, fullName: "Maya Fernandez", role: "USER", image: portrait("women", 44) },
  { key: "tariq", email: "tariq.rahman@shelfwise.demo", fullName: "Tariq Rahman", role: "USER", image: portrait("men", 32) },
  { key: "noah", email: "noah.lindqvist@shelfwise.demo", fullName: "Noah Lindqvist", role: "USER", image: portrait("men", 75) },
  { key: "lena", email: "lena.fischer@shelfwise.demo", fullName: "Lena Fischer", role: "USER", image: portrait("women", 21) },
];

// [who, book title, quantity, borrowed days ago, due in days (negative = overdue), returned?]
const loans: [string, string, number, number, number, boolean][] = [
  ["reader", "Pride and Prejudice", 1, 9, 5, false],
  ["reader", "Walden", 1, 25, -4, false],
  ["reader", "Dracula", 1, 40, -20, true],
  ["tariq", "On the Origin of Species", 1, 12, 2, false],
  ["tariq", "The Art of War", 2, 30, -10, true],
  ["noah", "Moby-Dick", 1, 6, 8, false],
  ["noah", "Frankenstein", 1, 20, -2, false],
  ["lena", "Alice's Adventures in Wonderland", 2, 3, 11, false],
  ["lena", "Pride and Prejudice", 1, 35, -15, true],
  ["tariq", "Meditations", 1, 5, 9, false],
];

const clear = async () => {
  const demo = await User.find({ isDemo: true }).select("_id");
  const ids = demo.map((u) => u._id);
  const isbns = books.map((b) => b.isbn);
  const seeded = await Book.distinct("_id", { isbn: { $in: isbns } });
  const [loansGone, booksGone] = await Promise.all([
    Borrow.deleteMany({ $or: [{ user: { $in: ids } }, { book: { $in: seeded } }] }),
    Book.deleteMany({ _id: { $in: seeded } }),
  ]);
  const users = await User.deleteMany({ isDemo: true });
  console.log(`Removed ${users.deletedCount} demo accounts, ${booksGone.deletedCount} books and ${loansGone.deletedCount} loans.`);
};

const seed = async () => {
  await clear();
  const password = await hashPassword(DEMO_PASSWORD);

  const users: Record<string, InstanceType<typeof User>> = {};
  for (const p of people) {
    users[p.key] = (await User.findOneAndUpdate(
      { email: p.email },
      { $set: { fullName: p.fullName, role: p.role, profileImageUrl: p.image, emailVerified: true, isBlocked: false, isDemo: true, password } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )) as InstanceType<typeof User>;
  }

  // Shelf stock: 2 to 7 copies each, then the open loans below take their copies off the shelf.
  const created = await Book.insertMany(
    books.map((b, i) => ({
      title: b.title,
      author: b.author,
      genre: b.genre,
      isbn: b.isbn,
      description: `${b.description}\n\nSource: ${b.wikipedia} (CC BY-SA).`,
      coverImageUrl: b.coverImage || b.coverImageUrl || undefined,
      publishedYear: b.publishedYear,
      copies: 2 + ((i * 5) % 6),
    }))
  );
  const bookOf = new Map(created.map((b) => [b.title, b]));

  for (const [who, title, quantity, borrowedAgo, dueIn, returned] of loans) {
    const book = bookOf.get(title);
    if (!book) throw new Error(`Seed loan refers to an unknown book: ${title}`);
    const borrowedAt = new Date(Date.now() - borrowedAgo * day);
    await Borrow.create({
      book: book._id,
      user: users[who]._id,
      quantity,
      dueDate: new Date(Date.now() + dueIn * day),
      ...(returned ? { returnedAt: new Date(borrowedAt.getTime() + Math.min(borrowedAgo - 1, 14) * day) } : {}),
      createdAt: borrowedAt,
      updatedAt: borrowedAt,
    });
    if (!returned) {
      book.copies = Math.max(0, book.copies - quantity);
    }
  }
  for (const b of created) {
    b.updateAvailability();
    await b.save();
  }

  console.log(`Seeded ${created.length} books, ${people.length} demo accounts and ${loans.length} loans. Password for the demo accounts: ${DEMO_PASSWORD}`);
};

const main = async () => {
  await connectDB();
  console.log(`Database: ${env.MONGODB_DB}`);
  if (process.argv[2] === "clear") await clear();
  else await seed();
  await disconnectDB();
};

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
