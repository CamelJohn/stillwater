import express, { NextFunction, Request, Response } from "express";
import { db } from "../../database/database";
import { IsLoggedIn, Validate } from "../../server/middleware";
import {
  articleDomainToContract,
  getArticleContractToDomain,
  listArticlesDomainToContract,
} from "./mappers";
import {
  createArticleFromRequest,
  getArticleFromSlug,
  getSlugFromUpdateRequest,
  getUserNewArticle,
  getUserUpdatedArticle,
} from "./helpers";

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

// TODO: build filters
articleRouter.get(
  "",
  Validate(["auth-header"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const where = req.query.username ? { username: req.query.username } : {};

    const users = await db.models.User.findAll({
      where,
      include: [{ model: db.models.Profile }, { model: db.models.Article }],
    });

    res.status(200).send(listArticlesDomainToContract(users));
  }
);

articleRouter.get("/feed");

articleRouter.post("/:slug/favorite");
articleRouter.delete("/:slug/favorite");

articleRouter.post("/:slug/comment");
articleRouter.get("/:slug/comment");
articleRouter.delete("/:slug/comment/:id");
