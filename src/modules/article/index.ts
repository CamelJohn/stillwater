import express, { NextFunction, Request, Response } from "express";
import { db } from "../../database/database";
import { IsLoggedIn, Validate } from "../../server/middleware";
import {
  articleDomainToContract,
  commentDomainToContract,
  getArticleContractToDomain,
  listArticlesDomainToContract,
} from "./mappers";
import {
  addComment,
  articleFromSlug,
  createArticleFromRequest,
  favoriteArticle,
  getArticleFromSlug,
  getSlugFromUpdateRequest,
  getUserNewArticle,
  getUserUpdatedArticle,
  unfavoriteArticle,
} from "./helpers";
import { getUserFromToken, lowerKebabCase } from "../../helpers/helpers";

export const articleRouter = express.Router();

articleRouter.post(
  "",
  Validate(["auth-header"]),
  IsLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    const article = await createArticleFromRequest(req, next);

    const user = await getUserNewArticle(article, req, next);

    res.status(201).send(articleDomainToContract(user));
  }
);

articleRouter.get(
  "/:slug",
  Validate(["auth-header", "get-article"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getArticleFromSlug(req, next);

    res.status(200).send(getArticleContractToDomain(user, req.params.slug));
  }
);

articleRouter.put(
  "/:slug",
  Validate(["auth-header", "update-article-params", "update-article"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserUpdatedArticle(req, next);

    const slug = getSlugFromUpdateRequest(req);

    const query = !req.body.article.title
      ? { ...req.body.article }
      : { ...req.body.article, slug: lowerKebabCase(req.body.article.title) };

    await db.models.article.update(query, {
      where: { userId: user.id, slug: req.params.slug },
    });

    const updatedUser = (
      await db.models.user.findOne({
        where: { id: user.id },
        include: [{ model: db.models.profile }, { model: db.models.article }],
      })
    )?.toJSON();

    res.status(201).send(getArticleContractToDomain(updatedUser, slug));
  }
);

articleRouter.delete(
  "/:slug",
  Validate(["auth-header", "delete-article-params"]),
  async (req: Request, res: Response, next: NextFunction) => {
    await db.models.article.destroy({
      where: { slug: req.params.slug },
    });

    res.status(200).send("article delete");
  }
);

// TODO: build filters
articleRouter.get(
  "",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const where = req.query.username ? { username: req.query.username } : {};

    const users = await db.models.user.findAll({
      where,
      include: [{ model: db.models.profile }, { model: db.models.article }],
    });

    res.status(200).send(listArticlesDomainToContract(users));
  }
);

// TODO: fix where clause - needs to fix favorited/followed too
articleRouter.get(
  "/feed",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const articles = await db.models.user.findAll({
      include: [
        { model: db.models.profile },
        { model: db.models.article, where: {} },
      ],
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 0,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 20,
    });

    res.status(200).send(listArticlesDomainToContract(articles));
  }
);

articleRouter.post(
  "/:slug/favorite",
  Validate(["auth-header", "favorite-article-params"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await favoriteArticle(req, next);

    res.status(201).send(getArticleContractToDomain(user, req.params.slug));
  }
);

articleRouter.delete(
  "/:slug/favorite",
  Validate(["auth-header", "favorite-article-params"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await unfavoriteArticle(req, next);

    res.status(201).send(getArticleContractToDomain(user, req.params.slug));
  }
);

articleRouter.post(
  "/:slug/comment",
  Validate(["auth-header", "create-comment-params"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await getUserFromToken(req);
    const article = await articleFromSlug(req);
    const comment = await addComment(req, article.id);

    res.status(201).send(commentDomainToContract(me, comment));
  }
);
articleRouter.get("/:slug/comment");

articleRouter.delete("/:slug/comment/:id");
