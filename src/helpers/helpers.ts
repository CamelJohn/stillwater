import { Request } from "express";
import { db } from "../database/database";
import { decodeToken } from "../services/jwt";

function extractToken(req: Request) {
  return req.headers?.authorization?.replace("Bearer ", "") || "";
}

export async function getUserFromToken(req: Request) {
  const raw = extractToken(req);
  const decoded = decodeToken(raw);

  const user = await db.models.user.findOne({
    where: { email: decoded.email },
    include: [
      { model: db.models.profile },
      { model: db.models.article },
      { model: db.models.comment }
    ],
  });

  return user?.toJSON();
}

export function lowerKebabCase(text: string) {
  return text.split(" ").join("-").toLowerCase();
}
