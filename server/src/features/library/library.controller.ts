import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { libraryService } from './library.service';

export const libraryController = {
  // Categories
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await libraryService.createCategory(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { category } });
  }),
  listCategories: asyncHandler(async (req: Request, res: Response) => {
    const items = await libraryService.listCategories(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),
  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await libraryService.updateCategory(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body.name,
    );
    res.status(200).json({ success: true, data: { category } });
  }),
  removeCategory: asyncHandler(async (req: Request, res: Response) => {
    await libraryService.removeCategory(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Books
  createBook: asyncHandler(async (req: Request, res: Response) => {
    const book = await libraryService.createBook(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { book } });
  }),
  listBooks: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await libraryService.listBooks(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),
  getBook: asyncHandler(async (req: Request, res: Response) => {
    const book = await libraryService.getBook(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { book } });
  }),
  updateBook: asyncHandler(async (req: Request, res: Response) => {
    const book = await libraryService.updateBook(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { book } });
  }),
  removeBook: asyncHandler(async (req: Request, res: Response) => {
    await libraryService.removeBook(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Issue / return
  issueBook: asyncHandler(async (req: Request, res: Response) => {
    const issue = await libraryService.issueBook(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { issue } });
  }),
  returnBook: asyncHandler(async (req: Request, res: Response) => {
    const issue = await libraryService.returnBook(
      requireSchoolId(req.user),
      req.params.issueId as string,
    );
    res.status(200).json({ success: true, data: { issue } });
  }),
  listIssues: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await libraryService.listIssues(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  remindOverdue: asyncHandler(async (req: Request, res: Response) => {
    const result = await libraryService.remindOverdue(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: result });
  }),
};
