import { Model } from "sequelize";

export function profileDomainToContract(
  user: any,
  domainProfile?: Model<any, any>
) {
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
