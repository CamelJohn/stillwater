import express, { NextFunction, Request, Response } from "express";
import { getUserFromToken } from "../../helpers/helpers";
import { IsLoggedIn, Validate } from "../../server/middleware";
import { NotFound, BadRequest } from "http-errors";
import { getUserById } from "./helpers";
import { updateUserContractToDomain, userDomainToContract } from "./mappers";

export const userRouter = express.Router();

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
