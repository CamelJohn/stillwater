import { Model } from "sequelize";

export async function mapTagsDomainToContract(raw: Model<any, any>[]) {
  return {
    tags: raw.map((tag) => tag.toJSON().name),
  };
}
