import express, { NextFunction, Request, Response } from "express";
import { NotFound, Unauthorized } from "http-errors";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { profileDomainToContract } from "../helpers/mappers";
import { Validate } from "../server/middleware";

export const profileRouter = express.Router();

function followProfile(following: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.models.User.findOne({
      where: { username: req.params.username },
    });

    if (!user) {
      return next(new NotFound("user does not exist"));
    }

    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized());
    }

    await db.models.Profile.update(
      { following },
      { where: { userId: user.toJSON().id } }
    );

    const updatedUser = await db.models.User.findOne({
      where: { id: user.toJSON().id },
      include: { model: db.models.Profile },
    });

    if (!updatedUser) {
      return next(new NotFound("profile does not exist."));
    }

    res.status(201).send(profileDomainToContract(updatedUser));
  };
}

profileRouter.get(
  "/:username",
  Validate(["auth-header", "get-profile"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const where = { username: req.params.username };
    const include = { model: db.models.Profile };
    const userQuery = { where, include };

    const user = await db.models.User.findOne(userQuery);

    if (!user) {
      return next(new NotFound("profile does not exist"));
    }

    res.status(200).send(profileDomainToContract(user));
  }
);

profileRouter.post(
  "/:username/follow",
  Validate(["auth-header", "follow-profile"]),
  followProfile(true)
);

profileRouter.delete(
  "/:username/follow",
  Validate(["auth-header", "unfollow-profile"]),
  followProfile(false)
);
