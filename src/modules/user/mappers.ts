import { Request } from "express";
import { db } from "../../database/database";
import { getUserFromToken } from "../../helpers/helpers";

export async function updateUserContractToDomain(req: Request) {
  const me = await getUserFromToken(req);

  const { email, password, username, image, bio } = req.body.user;

  await db.transaction(async (t) => {
    try {
      await db.models.User.update(
        {
          email,
          password,
          username,
        },
        { where: { id: me?.id }, transaction: t }
      );

      await db.models.Profile.update(
        { image, bio },
        { where: { userId: me?.id }, transaction: t }
      );
    } catch (error) {
      t.rollback();
    }
  });

  return me?.id;
}

export function userDomainToContract(user: any) {
  return {
    user: {
      email: user?.email,
      token: user?.token,
      username: user?.username,
      bio: user?.Profile?.bio,
      image: user?.Profile?.image,
    },
  };
}