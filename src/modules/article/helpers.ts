import { NextFunction, Request } from "express";
import { db } from "../../database/database";
import { getUserFromToken, lowerKebabCase } from "../../helpers/helpers";
import {
  articleContractToDomain,
  updateArticleContractToDomain,
} from "./mappers";
import { BadRequest, Unauthorized } from "http-errors";

export async function createArticleFromRequest(
  req: Request,
  next: NextFunction
) {
  const me = await getUserFromToken(req);

  const article = (
    await db.models.Article.create(articleContractToDomain(req, me?.id))
  )?.toJSON();

  if (!article) {
    return next(new BadRequest());
  }

  return article;
}

export async function getUserNewArticle(
  article: any,
  req: Request,
  next: NextFunction
) {
  const me = await getUserFromToken(req);

  const user = await db.models.User.findOne({
    where: { id: me?.id },
    include: [
      {
        model: db.models.Profile,
      },
      {
        model: db.models.Article,
        where: { id: article?.id },
      },
    ],
  });

  if (!user) {
    return next(new BadRequest());
  }

  return user;
}

export async function getArticleFromSlug(req: Request, next: NextFunction) {
  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized("invalid credentials"));
  }

  const user = (
    await db.models.User.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
        },
      ],
    })
  )?.toJSON();

  if (!user) {
    return next(new Unauthorized("invalid credentials"));
  }

  return user;
}

export async function updateArticle(req: Request, next: NextFunction) {
  const [result] = await db.models.Article.update(
    updateArticleContractToDomain(req),
    { where: { slug: req.params.slug } }
  );

  if (result === 0) {
    return next(new BadRequest());
  }
}

export async function getUserUpdatedArticle(req: Request, next: NextFunction) {
  const me = await getUserFromToken(req);

  if (!me) {
    return next(new Unauthorized("invalid credentials"));
  }

  const user = (
    await db.models.User.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
        },
      ],
    })
  )?.toJSON();

  if (!user) {
    return next(new Unauthorized("invalid credentials"));
  }

  return user;
}

export function getSlugFromUpdateRequest(req: Request) {
  if (!req.body.article.title) {
    return req.params.slug;
  }
  
  return lowerKebabCase(req.body.article.title);
}
