import jwt from "jsonwebtoken";

export function generateToken(email: string) {
  return jwt.sign({ email }, "lies", {
    encoding: "utf8",
    expiresIn: "7d",
  });
}

export function decodeToken(raw: string) {
  return jwt.decode(raw) as jwt.JwtPayload;
}
