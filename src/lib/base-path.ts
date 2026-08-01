const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// next's Link/router handle basePath automatically, but using fetch() doesn't...
export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
