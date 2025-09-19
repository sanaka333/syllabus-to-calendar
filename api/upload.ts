import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TODO: handle file here
    return res.status(200).json({ message: "Upload works on Vercel!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}