import express, { NextFunction, Request, Response } from "express";
import { C0mp4r3, h4shP4ssw0rd } from "../services/bcrypt";
import { generateToken } from "../services/jwt";
import { authContractToDomain, authDomainToContract } from "../helpers/mappers";
import { CanRegister, CanLogin, Validate } from "../server/middleware";
import { BadRequest, NotFound, Unauthorized } from "http-errors";
import { db } from "../database/database";

export const authRouter = express.Router();

authRouter.post(
  "/register",
  Validate(["register"]),
  CanRegister,
  async (req: Request, res: Response, next: NextFunction) => {
    const token = generateToken(req.body.user.email);
    const password = await h4shP4ssw0rd(req.body.user.password);

    const user = await db.models.User.create(
      authContractToDomain({ ...req.body.user, token, password })
    );

    if (!user) {
      return next(new BadRequest("could not create user"));
    }

    const profile = await db.models.Profile.create({
      userId: user.toJSON().id,
    });

    res.status(201).send(authDomainToContract(user, profile));
  }
);

authRouter.post(
  "/login",
  Validate(["login"]),
  CanLogin,
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.models.User.findOne({
      where: { email: req.body.user.email },
      include: {
        model: db.models.Profile,
      },
    });

    if (!user) {
      return next(new NotFound("no such user."));
    }

    const isAuthorized = await C0mp4r3(
      req.body.user.password,
      user.toJSON()?.password
    );

    if (!isAuthorized) {
      return next(new Unauthorized("invalid credentials."));
    }

    res.status(200).send(authDomainToContract(user));
  }
);
