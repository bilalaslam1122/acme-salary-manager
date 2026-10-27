import { z } from "zod";

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;

/** `page` / `pageSize` query params shared by every paginated endpoint (AD-5). */
export const paginationShape = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export const paginationSchema = z.object(paginationShape);

export type Pagination = z.infer<typeof paginationSchema>;
