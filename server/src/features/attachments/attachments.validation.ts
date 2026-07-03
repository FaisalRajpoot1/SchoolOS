import { z } from 'zod';

/** Params for routes nested under a task: /:id/attachments/:attachmentId. */
export const attachmentParamSchema = z.object({
  id: z.string().uuid(),
  attachmentId: z.string().uuid(),
});
