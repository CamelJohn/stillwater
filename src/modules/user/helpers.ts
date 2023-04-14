import { db } from "../../database/database";

export async function getUserById(id: string) {
  return db.models.User.findOne({
    where: { id },
    include: {
      model: db.models.Profile,
    },
  });
}
