import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import Joi, { string } from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Sequelize, DataTypes, Model } from "sequelize";
import {
  isHttpError,
  UnprocessableEntity,
  Conflict,
  Unauthorized,
  NotFound,
  BadRequest,
} from "http-errors";

function authDomainToContract(
  domainUser: Model<any, any>,
  domainProfile?: Model<any, any>
) {
  const user = domainUser.toJSON();
  const profile = domainProfile?.toJSON();

  return {
    user: {
      email: user?.email,
      token: user?.token,
      username: user?.username,
      bio: profile?.bio ?? user?.Profile?.bio,
      image: profile?.image ?? user?.Profile?.image,
    },
  };
}

function profileDomainToContract(
  domainUser: Model<any, any>,
  domainProfile?: Model<any, any>
) {
  const user = domainUser.toJSON();
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

function articleDomainToContract(domainUser: Model<any, any>) {
  const user = domainUser.toJSON();
  const [article] = user.Articles;

  return {
    article: {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favorited,
      favoritesCount: article.favorited,
      author: {
        username: user.username,
        bio: user.Profile.bio,
        image: user.Profile.image,
        following: user.Profile.following,
      },
    },
  };
}

function articleContractToDomain() {}

(async () => {
  try {
    const db = new Sequelize({
      database: "real-world-app",
      username: "postgres",
      password: "camel23986",
      dialect: "postgres",
      port: 5433,
      define: {
        timestamps: true,
        paranoid: true,
      },
      sync: {
        logging: (message) => console.log(message),
        force: false,
        alter: false,
      },
    });

    db.define("User", {
      id: {
        primaryKey: true,
        allowNull: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      token: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.STRING,
      },
      username: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    });

    db.define(
      "Profile",
      {
        id: {
          primaryKey: true,
          allowNull: true,
          defaultValue: DataTypes.UUIDV4,
          type: DataTypes.UUID,
        },
        userId: {
          allowNull: false,
          type: DataTypes.UUID,
          references: {
            model: db.models.User,
            key: "id",
          },
        },
        bio: {
          allowNull: true,
          defaultValue: null,
          type: DataTypes.STRING,
        },
        image: {
          allowNull: true,
          defaultValue: null,
          type: DataTypes.STRING,
        },
        following: {
          allowNull: true,
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      { indexes: [{ unique: true, fields: ["userId"] }] }
    );

    db.define("Article", {
      id: {
        primaryKey: true,
        allowNull: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tagId: {
        allowNull: true,
        type: DataTypes.UUID,
        defaultValue: null,
      },
      favorited: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      favoriteCount: {
        type: DataTypes.INTEGER({ unsigned: false }),
        allowNull: true,
        defaultValue: 0,
      },
      userId: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: db.models.User,
          key: "id",
        },
      },
    });

    db.models.User.hasOne(db.models.Profile, { foreignKey: "userId" });
    db.models.Profile.belongsTo(db.models.User);
    db.models.User.hasMany(db.models.Article, { foreignKey: "userId" });
    db.models.Article.belongsTo(db.models.User);

    await db.authenticate();
    await db.sync({ force: false });
    // await db.drop();

    const webServer = express();
    const webRouter = express.Router();

    webRouter.post(
      "/auth/register",
      (req: Request, res: Response, next: NextFunction) => {
        const registerValidationSchema = Joi.object({
          user: Joi.object({
            email: Joi.string().email().required(),
            username: Joi.string().required(),
            password: Joi.string().min(8).required(),
          }).required(),
        }).required();

        const isValidRequestBody = registerValidationSchema.validate(req.body);

        if (isValidRequestBody.error) {
          throw new UnprocessableEntity(isValidRequestBody.error.message);
        }

        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const userExists = await db.models.User.findOne({
          where: { email: req.body.user.email },
        });

        if (!userExists) {
          return next();
        }

        next(new Conflict("user email already taken."));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const salt = await bcrypt.genSalt(12);
        const password = await bcrypt.hash(req.body.user.password, salt);
        const token = jwt.sign({ email: req.body.user.email }, "lies", {
          encoding: "utf8",
          expiresIn: "7d",
        });

        const domainUser = await db.models.User.create({
          ...req.body.user,
          password,
          token,
        });
        const domainProfile = await db.models.Profile.create({
          userId: domainUser.toJSON().id,
        });

        const result = authDomainToContract(domainUser, domainProfile);
        res.status(201).send(result);
      }
    );

    webRouter.post(
      "/auth/login",
      (req: Request, res: Response, next: NextFunction) => {
        const loginValidationSchema = Joi.object({
          user: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
          }).required(),
        }).required();

        const isValidRequestBody = loginValidationSchema.validate(req.body);

        if (isValidRequestBody.error) {
          throw new UnprocessableEntity(isValidRequestBody.error.message);
        }

        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const userExists = await db.models.User.findOne({
          where: { email: req.body.user.email },
        });

        if (!userExists) {
          return next(new Unauthorized("invalid credentials."));
        }

        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const domainUser = await db.models.User.findOne({
          where: { email: req.body.user.email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new NotFound("no such user."));
        }

        const isAuthorized = await bcrypt.compare(
          req.body.user.password,
          domainUser.toJSON()?.password
        );

        if (!isAuthorized) {
          return next(new Unauthorized("invalid credentials."));
        }

        const result = authDomainToContract(domainUser);

        res.status(200).send(result);
      }
    );

    webRouter.get(
      "/auth/me",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;
        const domainUser = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new NotFound("no such user."));
        }

        const result = authDomainToContract(domainUser);

        res.status(200).send(result);
      }
    );

    webRouter.get(
      "/profile/:username",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      (req: Request, res: Response, next: NextFunction) => {
        const requestParamsValidationSchema = Joi.object({
          username: Joi.string().required(),
        });

        const isParamsValid = requestParamsValidationSchema.validate(
          req.params
        );

        if (!isParamsValid.error) {
          return next();
        }

        next(new UnprocessableEntity(isParamsValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const domainUser = await db.models.User.findOne({
            where: {
              username: req.params.username,
            },
            include: {
              model: db.models.Profile,
            },
          });

          if (!domainUser) {
            return next(new NotFound("profile does not exist"));
          }

          const result = profileDomainToContract(domainUser);

          res.status(200).send(result);
        } catch (error) {
          console.log(error);
        }
      }
    );

    webRouter.post(
      "/profile/:username/follow",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      (req: Request, res: Response, next: NextFunction) => {
        const requestParamsValidationSchema = Joi.object({
          username: Joi.string().required(),
        });

        const isParamsValid = requestParamsValidationSchema.validate(
          req.params
        );

        if (!isParamsValid.error) {
          return next();
        }

        next(new UnprocessableEntity(isParamsValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const userToFollow = await db.models.User.findOne({
          where: { username: req.params.username },
        });

        if (!userToFollow) {
          return next(new NotFound("user does not exist"));
        }

        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;

        const me = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!me) {
          return next(new Unauthorized());
        }

        await db.models.Profile.update(
          { following: true },
          { where: { userId: userToFollow.toJSON().id } }
        );

        const updatedDomainUser = await db.models.User.findOne({
          where: { id: userToFollow.toJSON().id },
          include: { model: db.models.Profile },
        });

        if (!updatedDomainUser) {
          return next(new NotFound("profile does not exist."));
        }

        const result = profileDomainToContract(updatedDomainUser);

        res.status(201).send(result);
      }
    );

    webRouter.delete(
      "/profile/:username/follow",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      (req: Request, res: Response, next: NextFunction) => {
        const requestParamsValidationSchema = Joi.object({
          username: Joi.string().required(),
        });

        const isParamsValid = requestParamsValidationSchema.validate(
          req.params
        );

        if (!isParamsValid.error) {
          return next();
        }

        next(new UnprocessableEntity(isParamsValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const userToFollow = await db.models.User.findOne({
          where: { username: req.params.username },
        });

        if (!userToFollow) {
          return next(new NotFound("user does not exist"));
        }

        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;

        const me = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!me) {
          return next(new Unauthorized());
        }

        await db.models.Profile.update(
          { following: false },
          { where: { userId: userToFollow.toJSON().id } }
        );

        const updatedDomainUser = await db.models.User.findOne({
          where: { id: userToFollow.toJSON().id },
          include: { model: db.models.Profile },
        });

        if (!updatedDomainUser) {
          return next(new BadRequest());
        }

        const result = profileDomainToContract(updatedDomainUser);

        res.status(201).send(result);
      }
    );

    webRouter.put(
      "/user",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;
        const domainUser = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new Unauthorized());
        }

        next();
      },
      (req: Request, res: Response, next: NextFunction) => {
        const updateValidationSchema = Joi.object({
          user: Joi.object()
            .keys({
              email: Joi.string().email(),
              username: Joi.string(),
              password: Joi.string().min(8),
              image: Joi.string().allow(null),
              bio: Joi.string().allow(null),
            })
            .or("email", "username", "password", "image", "bio"),
        });

        const isValidRequest = updateValidationSchema.validate(req.body);

        if (!isValidRequest.error) {
          return next();
        }

        next(new UnprocessableEntity(isValidRequest.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const userEmail = (decodedToken as jwt.JwtPayload).email;
        const domainUser = await db.models.User.findOne({
          where: { email: userEmail },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new NotFound("user does not exist."));
        }

        const { email, password, username } = req.body.user;
        const { image, bio } = req.body.user;

        await db.models.User.update(
          { email, password, username },
          { where: { id: domainUser.toJSON().id } }
        );
        await db.models.Profile.update(
          { image, bio },
          { where: { userId: domainUser.toJSON().id } }
        );

        const domainUpdatedUser = await db.models.User.findOne({
          where: { id: domainUser.toJSON().id },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUpdatedUser) {
          return next(new BadRequest());
        }

        const result = authDomainToContract(domainUpdatedUser);

        res.status(201).send(result);
      }
    );

    webRouter.get("/article");

    webRouter.get("/article/feed");
    webRouter.get("/article/:slug");

    webRouter.post(
      "/article",
      (req: Request, res: Response, next: NextFunction) => {
        const authHeadersValidationSchema = Joi.object()
          .keys({
            authorization: Joi.string()
              .regex(/Bearer \w{0,}/)
              .required(),
          })
          .options({ allowUnknown: true });

        const isHeaderValid = authHeadersValidationSchema.validate(req.headers);

        if (!isHeaderValid.error) {
          return next();
        }

        next(new Unauthorized(isHeaderValid.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;
        const domainUser = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new Unauthorized());
        }

        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const createArticleValidationSchema = Joi.object({
          article: Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            body: Joi.string().required(),
            tagList: Joi.array().allow(Joi.string()),
          }).required(),
        });

        const isValidRequest = createArticleValidationSchema.validate(req.body);

        if (!isValidRequest.error) {
          return next();
        }

        next(new BadRequest(isValidRequest.error.message));
      },
      async (req: Request, res: Response, next: NextFunction) => {
        const rawToken = req.headers?.authorization?.replace("Bearer ", "");
        const decodedToken = jwt.decode(rawToken || "");
        const email = (decodedToken as jwt.JwtPayload).email;
        const domainUser = await db.models.User.findOne({
          where: { email },
          include: {
            model: db.models.Profile,
          },
        });

        if (!domainUser) {
          return next(new Unauthorized());
        }

        const createDomainArticle = await db.models.Article.create({
          ...req.body.article,
          userId: domainUser.toJSON().id,
        });

        if (!createDomainArticle) {
          return next(new BadRequest());
        }

        const user = await db.models.User.findOne({
          where: { id: domainUser.toJSON().id },
          include: [
            {
              model: db.models.Profile,
            },
            {
              model: db.models.Article,
              where: { id: createDomainArticle.toJSON().id },
            },
          ],
        });

        if (!user) {
          return next(new BadRequest());
        }

        const result = articleDomainToContract(user);

        res.status(201).send(result);
      }
    );

    webRouter.put("/article/:slug");
    webRouter.delete("/article/:slug");
    webRouter.post("/article/:slug/favorite");
    webRouter.delete("/article/:slug/favorite");

    webRouter.post("/article/:slug/comment");
    webRouter.get("/article/:slug/comment");
    webRouter.delete("/article/:slug/comment/:id");

    webRouter.get("/tag");

    webServer.use([
      express.json(),
      express.urlencoded({ extended: false }),
      morgan("dev"),
      cors(),
    ]);

    webServer.use(
      "/health",
      (req: Request, res: Response, next: NextFunction) => {
        res.status(200).send("Ok");
      }
    );

    webServer.use("/api/v1", webRouter);

    webServer.use("*", (req: Request, res: Response, next: NextFunction) => {
      res.status(404).send("route not found");
    });

    webServer.use(
      (error: any, req: Request, res: Response, next: NextFunction) => {
        if (isHttpError(error)) {
          return res
            .status(error.status)
            .send(`${error.name.replace("Error", "")}: ${error.message}`);
        }
        res.status(200).send("something went wrong");
      }
    );

    webServer.listen(8080, () =>
      console.log(`Webserver started listening on http://localhost:8080/api/v1`)
    );
  } catch (error) {
    console.log(error);
  }
})();
