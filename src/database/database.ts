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

function defineSchemasAndRelations() {
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
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
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

  // user has one profile (exactly)
  db.models.User.hasOne(db.models.Profile, { foreignKey: "userId", onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  db.models.Profile.belongsTo(db.models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });

  // a user may follow many profiles
  db.models.User.hasMany(db.models.Profile, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  db.models.Profile.belongsTo(db.models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  
  // a user may own many articles
  db.models.User.hasMany(db.models.Article, { foreignKey: "userId", onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  db.models.Article.belongsTo(db.models.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });

}

export function UseDatabase() {
  async function DBConnect() {
    defineSchemasAndRelations();
    await db.authenticate();
    await db.sync();
    // await db.drop();
  }

  async function DBDisconnect() {
    await db.close();
  }

  return {
    DBConnect,
    DBDisconnect,
  };
}
