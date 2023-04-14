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
  const user = (
    await db.models.user.findOne({
      where: { username: req.params.username },
    })
  )?.toJSON();

  if (!user) {
    return next(new NotFound("user does not exist"));
  }

  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized());
  }

  const profile = (
    await db.models.profile.findOne({ where: { userId: user.id } })
  )?.toJSON();

  await db.models.profile.update(
    { following: profile.following.filter((id: string) => id !== me.id) },
    { where: { userId: user.id } }
  );

  const updatedUser = await db.models.user.findOne({
    where: { id: user.id },
    include: { model: db.models.profile },
  });

  if (!updatedUser) {
    return next(new NotFound("profile does not exist."));
  }

  res.status(201).send(profileDomainToContract(updatedUser));
}

export async function followProfile(req: Request, res: Response, next: NextFunction) {
  const user = (
    await db.models.user.findOne({
      where: { username: req.params.username },
    })
  )?.toJSON();

  if (!user) {
    return next(new NotFound("user does not exist"));
  }

  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized());
  }

  const profile = (
    await db.models.profile.findOne({ where: { userId: user.id } })
  )?.toJSON();

  await db.models.profile.update(
    { following: [...new Set([...profile.following, me?.id])] },
    { where: { userId: user.id } }
  );

  const updatedUser = await db.models.user.findOne({
    where: { id: user.id },
    include: { model: db.models.profile },
  });

  if (!updatedUser) {
    return next(new NotFound("profile does not exist."));
  }

  res.status(201).send(profileDomainToContract(updatedUser));
}
