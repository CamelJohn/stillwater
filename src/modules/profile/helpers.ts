import { NextFunction, Request, Response } from "express";
import { db } from "../../database/database";
import { NotFound, Unauthorized } from "http-errors";
import { getUserFromToken } from "../../helpers/helpers";
import { profileDomainToContract } from "./mappers";

export async function unfollowProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized());
  }

  const user = (
    await db.models.user.findOne({
      where: { username: req.params.username },
      include: [{ model: db.models.profile }],
    })
  )?.toJSON();

  if (!user) {
    return next(new NotFound("user does not exist"));
  }

  const [, [profile]] = await db.models.followProfile.update(
    { profileId: null },
    { where: { userId: me.id, profileId: user.profile.id }, returning: true }
  );

  const updatedUser = await db.models.user.findOne({
    where: { id: user.id },
    include: { model: db.models.profile },
  });

  if (!updatedUser) {
    return next(new NotFound("profile does not exist."));
  }

  res.status(201).send(profileDomainToContract(updatedUser, profile));
}

export async function followProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized());
  }

  const user = (
    await db.models.user.findOne({
      where: { username: req.params.username },
      include: [{ model: db.models.profile }],
    })
  )?.toJSON();

  if (!user) {
    return next(new NotFound("user does not exist"));
  }

  const [profile] = await db.models.followProfile.upsert({
    userId: me.id,
    profileId: user.profile.id,
  });

  const updatedUser = await db.models.user.findOne({
    where: { id: user.id },
    include: { model: db.models.profile },
  });

  if (!updatedUser) {
    return next(new NotFound("profile does not exist."));
  }

  res.status(201).send(profileDomainToContract(updatedUser, profile));
}
