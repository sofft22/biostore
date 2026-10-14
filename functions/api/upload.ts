export const onRequestPost: PagesFunction = async () => {
  return Response.json(
    { error: "Upload not configured yet" },
    { status: 501 }
  );
};
