const configuredOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();

export const WEB_ORIGIN = (configuredOrigin || "http://10.0.2.2:3000").replace(
  /\/$/,
  "",
);

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || null;

export function hostedUrl(path = "/") {
  const url = new URL(path, `${WEB_ORIGIN}/`);
  url.searchParams.set("embed", "1");
  return url.toString();
}
