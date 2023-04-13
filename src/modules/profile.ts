import express, { NextFunction, Request, Response } from "express";
import { NotFound, Unauthorized } from "http-errors";
import { Model } from "sequelize";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { Validate } from "../server/middleware";

export const profileRouter = express.Router();

function profileDomainToContract(
  user: any,
  domainProfile?: Model<any, any>
) {
  const profile = domainProfile?.toJSON();

  return {
    profile: {
      username: user?.username,
      bio: profile?.bio ?? user?.Profile?.bio,
      image: profile?.image ?? user?.Profile?.image,
      following: profile?.following || user?.Profile?.following,
    },
  };
}

async function unfollowProfile(req: Request, res: Response, next: NextFunction) {
    
    const user = (await db.models.User.findOne({
      where: { username: req.params.username },
    }))?.toJSON();

    if (!user) {
      return next(new NotFound("user does not exist"));
    }

    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized());
    }

    const profile = (await db.models.Profile.findOne({ where: { userId: user.id }}))?.toJSON();

    await db.models.Profile.update(
      { following: profile.following.filter((id: string) => id !== me.id) },
      { where: { userId: user.id } }
    );

    const updatedUser = await db.models.User.findOne({
      where: { id: user.id },
      include: { model: db.models.Profile },
    });

    if (!updatedUser) {
      return next(new NotFound("profile does not exist."));
    }

    res.status(201).send(profileDomainToContract(updatedUser));
};

async function followProfile(req: Request, res: Response, next: NextFunction) {
    
    const user = (await db.models.User.findOne({
      where: { username: req.params.username },
    }))?.toJSON();

    if (!user) {
      return next(new NotFound("user does not exist"));
    }

    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized());
    }

    const profile = (await db.models.Profile.findOne({ where: { userId: user.id }}))?.toJSON(); 

    await db.models.Profile.update(
      { following: [...new Set([...profile.following, me?.id])] },
      { where: { userId: user.id } }
    );

    const updatedUser = await db.models.User.findOne({
      where: { id: user.id },
      include: { model: db.models.Profile },
    });

    if (!updatedUser) {
      return next(new NotFound("profile does not exist."));
    }

    res.status(201).send(profileDomainToContract(updatedUser));
};

profileRouter.get(
  "/:username",
  Validate(["auth-header", "get-profile"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await db.models.User.findOne({
      where: { username: req.params.username },
      include: { model: db.models.Profile },
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
