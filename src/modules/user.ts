import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { NotFound, BadRequest, Unauthorized } from "http-errors";
import {
  authDomainToContract,
  updateUserContractToDomain,
} from "../helpers/mappers";

export const userRouter = express.Router();

userRouter.get(
  "",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    
    const user = await getUserFromToken(req);

    if (!user) {
      return next(new NotFound("no such user."));
    }

    res.status(200).send(authDomainToContract(user));
  }
);

userRouter.put(
  "",
  Validate(["auth-header", "update-user"]),
  IsLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized("user does not exist."));
    }

    const id = me.toJSON().id;

    const { updaetProfile, updateUser } = updateUserContractToDomain(req);

    await db.models.User.update(updateUser, { where: { id } });
    await db.models.Profile.update(updaetProfile, { where: { userId: id } });

    const user = await db.models.User.findOne({
      where: { id },
      include: {
        model: db.models.Profile,
      },
    });

    if (!user) {
      return next(new BadRequest());
    }

    res.status(201).send(authDomainToContract(user));
  }
);
