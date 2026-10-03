import { notFound, redirect } from "next/navigation";
import { urlFromServer } from "@/server/middleware/redirect";

const Redirect = async ({ params }: { params: { slug: string } }) => {
  const getDataApi = await urlFromServer(params.slug);

  if (getDataApi.redirect404) {
    return notFound();
  }

  if (getDataApi.error) {
    return notFound();
  }

  if (!getDataApi.url) {
    return notFound();
  }

  redirect(getDataApi.url);
};

export default Redirect;
