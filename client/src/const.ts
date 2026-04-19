export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Always redirect unauthenticated users to the Bulnix login page.
// This was previously pointing to the Manus OAuth portal — that is intentionally removed.
export const getLoginUrl = (returnPath?: string): string => {
  if (returnPath) {
    return `/login?return=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
