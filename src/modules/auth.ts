import express, { NextFunction, Request, Response } from "express";
import { C0mp4r3, h4shP4ssw0rd } from "../services/bcrypt";
import { generateToken } from "../services/jwt";
import { CanRegister, CanLogin, Validate } from "../server/middleware";
import { BadRequest, NotFound, Unauthorized } from "http-errors";
import { db } from "../database/database";
import sequelize from "sequelize";

export const authRouter = express.Router();

function authDomainToContract(user: any) {
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

async function authCreateAndProfileUserFromRequest(req: Request) {
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

async function authGetUserFromRequest(req: Request) {
  const user = await db.models.User.findOne({
    where: { email: req.body.user.email },
    include: {
      model: db.models.Profile,
    },
  });

  return user?.toJSON();
}

authRouter.post(
  "/register",
  Validate(["register"]),
  CanRegister,
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authCreateAndProfileUserFromRequest(req);

    if (!user) {
      return next(new BadRequest("could not create user"));
    }

    res.status(201).send(authDomainToContract(user));
  }
);

authRouter.post(
  "/login",
  Validate(["login"]),
  CanLogin,
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authGetUserFromRequest(req);

    if (!user) {
      return next(new NotFound("no such user."));
    }

    const isAuthorized = await C0mp4r3(req.body.user.password, user.password);

    if (!isAuthorized) {
      return next(new Unauthorized("invalid credentials."));
    }

    res.status(200).send(authDomainToContract(user));
  }
);
