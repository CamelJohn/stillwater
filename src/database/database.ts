import { DataTypes, Sequelize } from "sequelize";

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
    logging: (message) => console.log(message),
    force: false,
    alter: false,
  },
});

function defineRelations() {
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
}

export function UseDatabase() {

  async function DBConnect() {
    defineRelations();
    await db.authenticate();
    await db.sync();
  }

  async function DBDisconnect() {
    await db.close();
  }

  return {
    DBConnect,
    DBDisconnect,
  };
}