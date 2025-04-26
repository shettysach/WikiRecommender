import { join } from "path";
import { statSync } from "fs";

const publicDir = join(import.meta.dir, "public");

await Bun.build({
  entrypoints: [
    join(publicDir, "/vis_graph.js"),
    join(publicDir, "/sigma_graph.js"),
  ],
  outdir: join(import.meta.dir, "public/dist"),
  format: "esm",
});

export default {
  port: 3000,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    let pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(publicDir, pathname);

    try {
      const stat = statSync(filePath);
      if (stat.isFile()) {
        return new Response(Bun.file(filePath));
      }
    } catch {
      return new Response("404 Not Found", { status: 404 });
    }

    return new Response("Unsupported", { status: 400 });
  },
};
