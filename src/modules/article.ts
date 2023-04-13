import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken, lowerKebabCase } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { BadRequest, Unauthorized } from "http-errors";
import {
  articleContractToDomain,
  articleDomainToContract,
  getArticleContractToDomain,
  updateArticleContractToDomain,
} from "../helpers/mappers";

export const articleRouter = express.Router();

articleRouter.post(
  "",
  Validate(["auth-header"]),
  IsLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    const me = await getUserFromToken(req);

    if (!me) {
      return next(new Unauthorized());
    }

    const { id } = me.toJSON();

    const article = await db.models.Article.create(
      articleContractToDomain(req, id)
    );

    if (!article) {
      return next(new BadRequest());
    }

    const articleId = article.toJSON().id;

    const user = await db.models.User.findOne({
      where: { id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
          where: { id: articleId },
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

    const user = await db.models.User.findOne({
      where: { id: me.toJSON().id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
        },
      ],
    });

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
    
    const [result] = await db.models.Article.update(updateArticleContractToDomain(req), { where: { slug: req.params.slug }});
    
    if (result === 0) {
      return next(new BadRequest());
    }

    const user = await db.models.User.findOne({
      where: { id: me.toJSON().id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
        },
      ],
    });

    if (!user) {
      return next(new Unauthorized("invalid credentials"));
    }

    const slug = !req.body.article.title ? req.params.slug : lowerKebabCase(req.params.slug);

    res.status(201).send(getArticleContractToDomain(user, slug));
  }
);

articleRouter.get("");

articleRouter.get("/feed");

articleRouter.delete("/:slug");
articleRouter.post("/:slug/favorite");
articleRouter.delete("/:slug/favorite");

articleRouter.post("/:slug/comment");
articleRouter.get("/:slug/comment");
articleRouter.delete("/:slug/comment/:id");
