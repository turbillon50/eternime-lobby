import type { MetadataRoute } from "next";

const BASE_URL = "https://eternime.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/como-funciona",
    "/explora",
    "/manifiesto",
    "/precios",
    "/eon",
    "/entrar",
    "/crear",
    "/privacidad",
    "/terminos",
    "/cookies",
  ];
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}
