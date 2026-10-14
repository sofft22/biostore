export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  if (url.pathname.startsWith("/api/")) {
    // Let the API function handle it
    return context.next();
  }

  // Everything else: serve the static React app
  return context.next();
};
