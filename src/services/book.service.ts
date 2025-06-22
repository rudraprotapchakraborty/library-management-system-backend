import { Book } from '../models/book.model';

export const createBook = (data: any) => Book.create(data);

export const getBooks = async (query: any) => {
  const { filter, sortBy = 'createdAt', sort = 'asc', limit = 10 } = query;

  const dbQuery: any = {};
  if (filter) dbQuery.genre = filter;

  return Book.find(dbQuery)
    .sort({ [sortBy]: sort === 'asc' ? 1 : -1 })
    .limit(Number(limit));
};

export const getBookById = (id: string) => Book.findById(id);

export const updateBook = (id: string, data: any) =>
  Book.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const deleteBook = (id: string) => Book.findByIdAndDelete(id);
