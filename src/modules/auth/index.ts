import express, { NextFunction, Request, Response } from "express";
import { C0mp4r3 } from "../../services/bcrypt";
import { CanRegister, CanLogin, Validate } from "../../server/middleware";
import { BadRequest, NotFound, Unauthorized } from "http-errors";
import { authCreateAndProfileUserFromRequest, authGetUserFromRequest } from "./helpers";
import { authDomainToContract } from "./mappers";

export const authRouter = express.Router();

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
