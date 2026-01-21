export const createPageUrl = (page: string): string => {
  const baseUrl = window.location.origin;
  const pathname = window.location.pathname;
  return `${baseUrl}${pathname}#/${page}`;
};
