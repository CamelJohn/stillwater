import { Request } from "express";
import { Model } from "sequelize";
import { lowerKebabCase } from "../../helpers/helpers";

export function authorDomainToContract(user: any, profile: any) {
  return {
    author: {
      username: user.username,
      bio: profile.bio,
      image: profile.image,
      following: profile.following,
    },
  };
}

export function articleDomainToProfile(article: any) {
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

export function articleDomainToContract(user: any) {
  const [article] = user.articles;

  return {
    article: {
      ...articleDomainToProfile(article),
      ...authorDomainToContract(user, user.profile),
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

export function getArticleContractToDomain(user: any, slug: string) {
  const article = user.articles.find((article: any) => article.slug === slug);

  return {
    article: {
      ...articleDomainToProfile(article),
      ...authorDomainToContract(user, user.profile),
    },
  };
}

export function updateArticleContractToDomain(req: Request) {
  if (!req.body.article.title) {
    return req.body.article;
  }

  return {
    ...req.body.article,
    slug: lowerKebabCase(req.body.article.title),
  };
}

export function mapArticleDomainToContract(article: any) {
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

export function listArticlesDomainToContract(users: Model<any, any>[]) {
  return users.reduce(
    (acc, current) => {
      const user = current?.toJSON();

      const articles: any[] = user.articles.map((article: any) => ({
        ...mapArticleDomainToContract(article),
        ...authorDomainToContract(user, user?.profile),
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
}

export function commentDomainToContract(user: any, comment: any) {
  const id = user.comments.findIndex((_comment: any) => _comment.id === comment.id);
  return {
    comment: {
      id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      ...authorDomainToContract(user, user.profile)
    }
  }
}