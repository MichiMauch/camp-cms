export interface Env {
  R2_BUCKET: R2Bucket
  BASE_URL: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Nur POST zulassen
    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const rawName = formData.get("filename") as string | null;

      if (!file || !rawName) {
        return new Response("Missing file or filename", {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const mimeType = file.type;
      let extension = mimeType.split("/")[1] || "bin";

      // Normiere .jpeg → .jpg
      if (extension === "jpeg") {
        extension = "jpg";
      }

      const safeBase = rawName.replace(/[^a-z0-9_-]/gi, "_");
      const finalFilename = safeBase.endsWith(`.${extension}`)
        ? safeBase
        : `${safeBase}.${extension}`;

      const buffer = await file.arrayBuffer();

      await env.R2_BUCKET.put(finalFilename, buffer, {
        httpMetadata: {
          contentType: mimeType,
        },
      });

      return new Response(
        JSON.stringify({ url: `${env.BASE_URL}/${finalFilename}` }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      return new Response(`Upload error: ${(error as Error).message}`, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
