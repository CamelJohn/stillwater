import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken, lowerKebabCase } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { BadRequest, Unauthorized } from "http-errors";

export const articleRouter = express.Router();

function authorDomainToContract(user: any, profile: any) {
  return {
    author: {
      username: user.username,
      bio: profile.bio,
      image: profile.image,
      following: profile.following,
    },
  };
}

function articleDomainToProfile(article: any) {
  return {
    slug: article?.slug,
    title: article?.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favorited,
    favoritesCount: article.favorited,
  };
}

function articleDomainToContract(user: any) {
  const [article] = user.Articles;

  return {
    article: {
      ...articleDomainToProfile(article),
      ...authorDomainToContract(user, user.Profile),
    },
  };
}

function articleContractToDomain(req: Request, userId: string) {
  const article = req.body.article;
  const slug = lowerKebabCase(article.title);

  return {
    ...article,
    slug,
    userId,
  };
}

function getArticleContractToDomain(user: any, slug: string) {
  const article = user.Articles.find((article: any) => article.slug === slug);

  return {
    article: {
      ...articleDomainToProfile(article),
      ...authorDomainToContract(user, user.Profile),
    },
  };
}

function updateArticleContractToDomain(req: Request) {
  if (!req.body.article.title) {
    return req.body.article;
  }

  return {
    ...req.body.article,
    slug: lowerKebabCase(req.body.article.title),
  };
}

function mapArticleDomainToContract(article: any) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favorited,
    favoritesCount: article.favoritesCount,
  };
}

articleRouter.post(
  "",
  Validate(["auth-header"]),
  IsLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await getUserFromToken(req);

    const article = (
      await db.models.Article.create(articleContractToDomain(req, me?.id))
    )?.toJSON();

    if (!article) {
      return next(new BadRequest());
    }

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

    res.status(201).send(articleDomainToContract(user));
  }
);

articleRouter.get(
  "/:slug",
  Validate(["auth-header", "get-article"]),
  async (req: Request, res: Response, next: NextFunction) => {
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

    res.status(200).send(getArticleContractToDomain(user, req.params.slug));
  }
);

articleRouter.put(
  "/:slug",
  Validate(["auth-header", "update-article-params", "update-article"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized("invalid credentials"));
    }

    const [result] = await db.models.Article.update(
      updateArticleContractToDomain(req),
      { where: { slug: req.params.slug } }
    );

    if (result === 0) {
      return next(new BadRequest());
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

    const slug = !req.body.article.title
      ? req.params.slug
      : lowerKebabCase(req.body.article.title);

    res.status(201).send(getArticleContractToDomain(user, slug));
  }
);

articleRouter.delete(
  "/:slug",
  Validate(["auth-header", "delete-article-params"]),
  async (req: Request, res: Response, next: NextFunction) => {
    await db.models.Article.destroy({
      where: { slug: req.params.slug },
    });

    res.status(200).send("article delete");
  }
);

articleRouter.get(
  "",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const where = req.query.username ? { username: req.query.username } : {};
    
    const users = await db.models.User.findAll({
      where,
      include: [{ model: db.models.Profile }, { model: db.models.Article }],
    });

    const result = users.reduce(
      (acc, current) => {
        const user = current?.toJSON();

        const articles: any[] = user.Articles.map((article: any) => ({
          ...mapArticleDomainToContract(article),
          ...authorDomainToContract(user, user?.Profile),
        }));

        acc.articles.push(...articles);
        acc.articlesCount += articles.length;

        return acc;
      },
      {
        articles: [] as any[],
        articlesCount: 0,
      }
    );

    res.status(200).send(result);
  }
);

articleRouter.get("/feed");

articleRouter.post("/:slug/favorite");
articleRouter.delete("/:slug/favorite");

articleRouter.post("/:slug/comment");
articleRouter.get("/:slug/comment");
articleRouter.delete("/:slug/comment/:id");
