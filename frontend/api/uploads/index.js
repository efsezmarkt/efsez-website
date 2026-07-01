import { handleUpload } from "@vercel/blob/client";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function send(res, status, payload) {
  res.status(status).json(payload);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

function isAdmin(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN || "change-me"}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Methode nicht erlaubt." });

  try {
    const body = parseBody(req);
    if (body?.type === "blob.generate-client-token" && !isAdmin(req)) {
      return send(res, 401, { error: "Zugangscode fehlt oder ist falsch." });
    }

    const response = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("efsez/")) throw new Error("Ungueltiger Upload-Pfad.");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
          cacheControlMaxAge: 31536000
        };
      },
      onUploadCompleted: async () => {}
    });

    return send(res, 200, response);
  } catch (error) {
    return send(res, 400, { error: error.message || "Upload fehlgeschlagen." });
  }
}
