import { NextFunction, Request } from "express";
import { db } from "../../database/database";
import { getUserFromToken, lowerKebabCase } from "../../helpers/helpers";
import {
  articleContractToDomain,
  updateArticleContractToDomain,
} from "./mappers";
import { BadRequest, Unauthorized, NotFound } from "http-errors";

export async function createArticleFromRequest(
  req: Request,
  next: NextFunction
) {
  const me = await getUserFromToken(req);

  const article = (
    await db.models.article.create(articleContractToDomain(req, me?.id))
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

  const user = await db.models.user.findOne({
    where: { id: me?.id },
    include: [
      {
        model: db.models.profile,
      },
      {
        model: db.models.article,
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
    await db.models.user.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.profile,
        },
        {
          model: db.models.article,
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
  const [result] = await db.models.article.update(
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
    await db.models.user.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.profile,
        },
        {
          model: db.models.article,
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

export async function favoriteArticle(req: Request, next: NextFunction) {
  const slug = req.params.slug;
  const me = await getUserFromToken(req);

  const article = (
    await db.models.article.findOne({
      where: { slug, userId: me?.id },
    })
  )?.toJSON();

  if (!article) {
    return next(new NotFound("article does not exist"));
  }

  const favorited = [...new Set(...[...article.favorited, me?.id])];
  const favoriteCound = article.favoriteCound + 1;

  await db.models.article.update(
    { favorited, favoriteCound },
    { where: { slug, userId: me?.id } }
  );

  const user = (
    await db.models.user.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.profile,
        },
        {
          model: db.models.article,
        },
      ],
    })
  )?.toJSON();

  if (!user) {
    return next(new Unauthorized("invalid credentials"));
  }

  return user;
}

export async function unfavoriteArticle(req: Request, next: NextFunction) {
  const slug = req.params.slug;
  const me = await getUserFromToken(req);

  const article = (
    await db.models.article.findOne({
      where: { slug, userId: me?.id },
    })
  )?.toJSON();

  if (!article) {
    return next(new NotFound("article does not exist"));
  }

  await db.models.article.update(
    {
      favorited: article.favorited.filter((id: string) => me?.id !== id),
      favoriteCound: article.favoriteCound - 1,
    },
    { where: { slug, userId: me?.id } }
  );

  const user = (
    await db.models.user.findOne({
      where: { id: me?.id },
      include: [
        {
          model: db.models.profile,
        },
        {
          model: db.models.article,
        },
      ],
    })
  )?.toJSON();

  if (!user) {
    return next(new Unauthorized("invalid credentials"));
  }

  return user;
}

export async function articleFromSlug(req: Request) {
  const article = (
    await db.models.article.findOne({ where: { slug: req.params.slug } })
  )?.toJSON();
  return article;
}

export async function addComment(req: Request, articleId: string) {
  const me = await getUserFromToken(req);

  const comment = (
    await db.models.comment.create({
      ...req.body.comment,
      articleId,
      userId: me.id,
    })
  )?.toJSON();

  return comment;
}
