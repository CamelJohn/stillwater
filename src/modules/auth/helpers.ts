import { Request } from "express";
import sequelize from "sequelize";
import { db } from "../../database/database";
import { h4shP4ssw0rd } from "../../services/bcrypt";
import { generateToken } from "../../services/jwt";

export async function authCreateAndProfileUserFromRequest(req: Request) {
  const token = generateToken(req.body.user.email);
  const password = await h4shP4ssw0rd(req.body.user.password);

  const userWithProfile = await db.models.user.create(
    {
      ...req.body.user,
      token,
      password,
      profile: { userId: sequelize.col("user.id") },
    },
    {
      include: {
        model: db.models.profile,
      },
    }
  );

  return userWithProfile.toJSON();
}

export async function authGetUserFromRequest(req: Request) {
  const user = await db.models.user.findOne({
    where: { email: req.body.user.email },
    include: [{
      model: db.models.profile,
    }, {
      model: db.models.article
    }, {
      model: db.models.comment
    }],
  });

  return user?.toJSON();
}
