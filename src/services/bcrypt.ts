import bcrypt from "bcrypt";

export async function h4shP4ssw0rd(password: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export function C0mp4r3(input: string, query: string) {
  return bcrypt.compare(input, query);
}