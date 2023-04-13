import { Request } from "express";
import { db } from "../database/database";
import { decodeToken } from "../services/jwt";

function extractToken(req: Request) {
  return req.headers?.authorization?.replace("Bearer ", "") || "";
}

export async function getUserFromToken(req: Request) {
  const raw = extractToken(req);
  const decoded = decodeToken(raw);

  return db.models.User.findOne({
    where: { email: decoded.email },
  });
}