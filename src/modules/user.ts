import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { NotFound, BadRequest } from "http-errors";

export const userRouter = express.Router();

async function getUserById(id: string) {
  return db.models.User.findOne({
    where: { id },
    include: {
      model: db.models.Profile,
    },
  });
}

async function updateUserContractToDomain(req: Request) {
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

function userDomainToContract(user: any) {
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

userRouter.get(
  "",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserFromToken(req);

    if (!user) {
      return next(new NotFound("no such user."));
    }

    res.status(200).send(userDomainToContract(user));
  }
);

userRouter.put(
  "",
  Validate(["auth-header", "update-user"]),
  IsLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    const id = await updateUserContractToDomain(req);

    const user = await getUserById(id);

    if (!user) {
      return next(new BadRequest());
    }

    res.status(201).send(userDomainToContract(user));
  }
);
