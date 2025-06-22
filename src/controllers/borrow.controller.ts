import { Request, Response, NextFunction } from 'express';
import * as borrowService from '../services/borrow.service';
import { successResponse } from '../utils/apiResponse';

export const borrowBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { book, quantity, dueDate } = req.body;
    const borrow = await borrowService.borrowBookService(
      book,
      quantity,
      new Date(dueDate)
    );
    res
      .status(201)
      .json(successResponse('Book borrowed successfully', borrow));
  } catch (err) {
    next(err);
  }
};

export const getBorrowSummary = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await borrowService.getBorrowSummaryService();
    res.json(
      successResponse('Borrowed books summary retrieved successfully', summary)
    );
  } catch (err) {
    next(err);
  }
};
