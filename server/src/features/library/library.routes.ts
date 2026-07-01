import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { libraryController } from './library.controller';
import {
  bookCategoryIdParamSchema,
  bookIdParamSchema,
  createBookCategorySchema,
  createBookSchema,
  issueBookSchema,
  issueIdParamSchema,
  listBooksSchema,
  listIssuesSchema,
  updateBookCategorySchema,
  updateBookSchema,
} from './library.validation';

const router = Router();

// The library is managed by school admins and librarians.
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN));

// Categories.
router.post('/categories', validate({ body: createBookCategorySchema }), libraryController.createCategory);
router.get('/categories', libraryController.listCategories);
router.patch(
  '/categories/:id',
  validate({ params: bookCategoryIdParamSchema, body: updateBookCategorySchema }),
  libraryController.updateCategory,
);
router.delete(
  '/categories/:id',
  validate({ params: bookCategoryIdParamSchema }),
  libraryController.removeCategory,
);

// Books.
router.post('/books', validate({ body: createBookSchema }), libraryController.createBook);
router.get('/books', validate({ query: listBooksSchema }), libraryController.listBooks);
router.get('/books/:id', validate({ params: bookIdParamSchema }), libraryController.getBook);
router.patch(
  '/books/:id',
  validate({ params: bookIdParamSchema, body: updateBookSchema }),
  libraryController.updateBook,
);
router.delete('/books/:id', validate({ params: bookIdParamSchema }), libraryController.removeBook);

// Issue / return.
router.post(
  '/books/:id/issue',
  validate({ params: bookIdParamSchema, body: issueBookSchema }),
  libraryController.issueBook,
);
router.post(
  '/issues/:issueId/return',
  validate({ params: issueIdParamSchema }),
  libraryController.returnBook,
);
router.get('/issues', validate({ query: listIssuesSchema }), libraryController.listIssues);

export const libraryRoutes = router;
