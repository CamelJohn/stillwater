import express, { NextFunction, Request, Response } from "express";
import { NotFound } from "http-errors";
import { db } from "../../database/database";
import { Validate } from "../../server/middleware";
import { followProfile, unfollowProfile } from "./helpers";
import { profileDomainToContract } from "./mappers";

export const profileRouter = express.Router();

profileRouter.get(
  "/:username",
  Validate(["auth-header", "get-profile"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.models.user.findOne({
      where: { username: req.params.username },
      include: [{ model: db.models.profile }],
    });

    if (!user) {
      return next(new NotFound("profile does not exist"));
    }

    res.status(200).send(profileDomainToContract(user.toJSON()));
  }
);

profileRouter.post(
  "/:username/follow",
  Validate(["auth-header", "follow-profile"]),
  followProfile
);

profileRouter.delete(
  "/:username/follow",
  Validate(["auth-header", "unfollow-profile"]),
  unfollowProfile
);
