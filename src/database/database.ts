import { ARRAY, DataTypes, Sequelize } from "sequelize";

export const db = new Sequelize({
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
    logging: (message) => console.log(message + '\n'),
    force: false,
    alter: false,
  },
});

function defineSchemasAndRelations() {
  const User = db.define("user", {
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

  const Profile = db.define("profile", {
    id: {
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
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
  });

  const FollowProfile = db.define("follow-profile", {
    id: {
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
    },
    profileId: {
      allowNull: false,
      type: DataTypes.UUID,
      references: {
        key: 'id',
        model: Profile,
      }
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID,
      references: {
        key: 'id',
        model: User,
      }
    }
  });

  const Article = db.define("article", {
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
  });

  const FavoriteArticle = db.define("favorite-article", {
    id: {
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
    },
    articleId: {
      allowNull: false,
      type: DataTypes.UUID,
      references: {
        key: 'id',
        model: Article,
      }
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID,
      references: {
        key: 'id',
        model: User,
      }
    }
  });

  const Tag = db.define("tag", {
    id: {
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
  });

  const Comment = db.define("comment", {
    id: {
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
    },
    body: {
      allowNull: false,
      type: DataTypes.STRING,
    },
  });

  // user has one profile (exactly)
  User.hasOne(Profile);

  Profile.belongsTo(User);

  // a user may own many articles
  User.hasMany(Article);

  Article.belongsTo(User);

  // user may create many comments
  User.hasMany(Comment);
  Comment.belongsTo(User);

  Article.hasMany(Comment);
  Comment.belongsTo(Article, {
    foreignKey: "articleId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  Article.hasMany(Tag);
  Tag.hasMany(Article);
}

export function UseDatabase() {
  async function DBConnect() {
    defineSchemasAndRelations();
    await db.authenticate();
    await db.sync();
    // await db.drop({ cascade: true });
    // await db.dropAllSchemas({});
  }

  async function DBDisconnect() {
    await db.close();
  }

  return {
    DBConnect,
    DBDisconnect,
  };
}
