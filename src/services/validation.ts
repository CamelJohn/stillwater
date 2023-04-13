import Joi from "joi";
import { UnprocessableEntity, Unauthorized, BadRequest } from "http-errors";

const registerValidationSchema = Joi.object({
  user: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }).required(),
}).required();

const loginValidationSchema = Joi.object({
  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }).required(),
}).required();

const authHeadersValidationSchema = Joi.object()
  .keys({
    authorization: Joi.string()
      .regex(/Bearer \w{0,}/)
      .required(),
  })
  .options({ allowUnknown: true });

const updateUserValidationSchema = Joi.object({
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

const usernameParamsValidationSchema = Joi.object({
  username: Joi.string().required(),
});

const createArticleValidationSchema = Joi.object({
  article: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    body: Joi.string().required(),
    tagList: Joi.array().allow(Joi.string()),
  }).required(),
});

export const getArticleParamValidationSchema = Joi.object({
  slug: Joi.string().required(),
}).required();

export const updateArticleParamValidationSchema =
  getArticleParamValidationSchema;

export const deleteArticleParamValidationSchema =
  getArticleParamValidationSchema;

export const updateArticleValidationSchema = Joi.object({
  article: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      body: Joi.string(),
    })
    .or("title", "description", "body"),
}).required();

type ValidationTarget = "body" | "headers" | "params";

export type ValidationKey =
  | "register"
  | "login"
  | "auth-header"
  | "update-user"
  | "get-profile"
  | "follow-profile"
  | "unfollow-profile"
  | "create-article"
  | "get-article"
  | "update-article-params"
  | "update-article"
  | "delete-article-params";

interface ValidationSchemaRecord {
  schema: Joi.ObjectSchema<any>;
  target: ValidationTarget;
  error: (message: string) => any;
}

export const ValidationSchema: Record<ValidationKey, ValidationSchemaRecord> = {
  register: {
    schema: registerValidationSchema,
    target: "body",
    error: (message) => new UnprocessableEntity(message),
  },
  login: {
    schema: loginValidationSchema,
    target: "body",
    error: (message) => new UnprocessableEntity(message),
  },
  "auth-header": {
    schema: authHeadersValidationSchema,
    target: "headers",
    error: (message) => new Unauthorized(message),
  },
  "update-user": {
    schema: updateUserValidationSchema,
    target: "body",
    error: (message) => new UnprocessableEntity(message),
  },
  "get-profile": {
    schema: usernameParamsValidationSchema,
    target: "params",
    error: (message) => new UnprocessableEntity(message),
  },
  "follow-profile": {
    schema: usernameParamsValidationSchema,
    target: "params",
    error: (message) => new UnprocessableEntity(message),
  },
  "unfollow-profile": {
    schema: usernameParamsValidationSchema,
    target: "params",
    error: (message) => new UnprocessableEntity(message),
  },
  "create-article": {
    schema: createArticleValidationSchema,
    target: "body",
    error: (message) => new UnprocessableEntity(message),
  },
  "get-article": {
    schema: getArticleParamValidationSchema,
    target: "params",
    error: (message) => new BadRequest(message),
  },
  "update-article-params": {
    schema: updateArticleParamValidationSchema,
    target: "params",
    error: (message) => new BadRequest(message),
  },
  "update-article": {
    schema: updateArticleValidationSchema,
    target: "body",
    error: (message) => new UnprocessableEntity(message),
  },
  "delete-article-params": {
    schema: deleteArticleParamValidationSchema,
    target: "params",
    error: (message) => new BadRequest(message),
  },
};
