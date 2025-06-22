import { Request, Response, NextFunction } from 'express';
import * as bookService from '../services/book.service';
import { successResponse } from '../utils/apiResponse';

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json(successResponse('Book created successfully', book));
  } catch (err) {
    next(err);
  }
};

export const getBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const books = await bookService.getBooks(req.query);
    res.json(successResponse('Books retrieved successfully', books));
  } catch (err) {
    next(err);
  }
};

export const getBookById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const book = await bookService.getBookById(req.params.bookId);
    if (!book) {
      res
        .status(404)
        .json({ message: 'Book not found', success: false, error: null });
      return;
    }
    res.json(successResponse('Book retrieved successfully', book));
  } catch (err) {
    next(err);
  }
};

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await bookService.updateBook(req.params.bookId, req.body);
    if (!updated) {
      res
        .status(404)
        .json({ message: 'Book not found', success: false, error: null });
      return;
    }
    res.json(successResponse('Book updated successfully', updated));
  } catch (err) {
    next(err);
  }
};

export const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await bookService.deleteBook(req.params.bookId);
    res.json(successResponse('Book deleted successfully', null));
  } catch (err) {
    next(err);
  }
};
