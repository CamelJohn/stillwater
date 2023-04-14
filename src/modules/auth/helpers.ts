import { Request } from "express";
import sequelize from "sequelize";
import { db } from "../../database/database";
import { h4shP4ssw0rd } from "../../services/bcrypt";
import { generateToken } from "../../services/jwt";

export async function authCreateAndProfileUserFromRequest(req: Request) {
  const token = generateToken(req.body.user.email);
  const password = await h4shP4ssw0rd(req.body.user.password);

  const userWithProfile = await db.models.User.create(
    {
      ...req.body.user,
      token,
      password,
      Profile: { userId: sequelize.col("User.id") },
    },
    {
      include: {
        model: db.models.Profile,
      },
    }
  );

  return userWithProfile.toJSON();
}

export async function authGetUserFromRequest(req: Request) {
  const user = await db.models.User.findOne({
    where: { email: req.body.user.email },
    include: {
      model: db.models.Profile,
    },
  });

  return user?.toJSON();
}
