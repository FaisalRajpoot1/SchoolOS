import { AxiosError } from 'axios';
import { api } from './axios';

/**
 * Fetches a file (e.g. a PDF) from the API with the auth interceptor applied,
 * then triggers a browser download. Honors the server's Content-Disposition
 * filename when present.
 */
export const downloadFile = async (url: string, fallbackName: string): Promise<void> => {
  const res = await api.get(url, { responseType: 'blob' }).catch(async (err: unknown) => {
    // With responseType 'blob', an error body is a Blob — convert it back to
    // the JSON envelope so getApiErrorMessage can read the server's message.
    if (err instanceof AxiosError && err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text());
      } catch {
        /* not JSON — leave the blob as-is */
      }
    }
    throw err;
  });

  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const objectUrl = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  // Defer revoke so the download has started before the URL is released.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};
