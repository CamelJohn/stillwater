import { Request } from "express";
import { Model } from "sequelize";
import { lowerKebabCase } from "./helpers";

export function authDomainToContract(
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

interface AuthContractToDomain {
  username: string;
  password: string;
  email: string;
  token: string;
}

export function authContractToDomain({
  username,
  token,
  email,
  password,
}: AuthContractToDomain) {
  return {
    email,
    token,
    username,
    password,
  };
}

export function updateUserContractToDomain(req: Request) {
  const { email, password, username, image, bio } = req.body.user;

  return {
    updateUser: { email, password, username },
    updaetProfile: { image, bio },
  };
}

export function profileDomainToContract(
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

export function articleDomainToContract(domainUser: Model<any, any>) {
  const user = domainUser.toJSON();
  const [article] = user.Articles;
  const profile = user.Profile;

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
        bio: profile.bio,
        image: profile.image,
        following: profile.following,
      },
    },
  };
}

export function articleContractToDomain(req: Request, userId: string) {
  const article = req.body.article;
  const slug = lowerKebabCase(article.title);

  return {
    ...article,
    slug,
    userId,
  };
}

export function getArticleContractToDomain(domainUser: Model<any, any>, slug: string) {
  const user = domainUser.toJSON();
  const profile = user.Profile;

  const article = user.Articles.filter((article) => article.slug === slug);

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
        bio: profile.bio,
        image: profile.image,
        following: profile.following,
      },
    },
  }
}

export function updateArticleContractToDomain(req: Request) {
  if (!req.body.article.title) {
    return req.body.article;
  }

  return {
    ...req.body.article,
    slug: lowerKebabCase(req.body.article.title)
  }
}