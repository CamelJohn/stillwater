import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { BadRequest, Unauthorized } from "http-errors";
import { articleDomainToContract } from "../helpers/mappers";

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

    const article = await db.models.Article.create({
      ...req.body.article,
      userId: id,
    });

    if (!article) {
      return next(new BadRequest());
    }

    const user = await db.models.User.findOne({
      where: { id },
      include: [
        {
          model: db.models.Profile,
        },
        {
          model: db.models.Article,
          where: { id: article.toJSON().id },
        },
      ],
    });

    if (!user) {
      return next(new BadRequest());
    }

    res.status(201).send(articleDomainToContract(user));
  }
);

articleRouter.get("");

articleRouter.get("/feed");
articleRouter.get("/:slug");

articleRouter.put("/:slug");
articleRouter.delete("/:slug");
articleRouter.post("/:slug/favorite");
articleRouter.delete("/:slug/favorite");

articleRouter.post("/:slug/comment");
articleRouter.get("/:slug/comment");
articleRouter.delete("/:slug/comment/:id");
