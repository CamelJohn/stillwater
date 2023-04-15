import { Model } from "sequelize";

export function profileDomainToContract(
  user: any,
  domainProfile?: Model<any, any>
) {
  const profile = domainProfile?.toJSON();

  return {
    profile: {
      username: user?.username,
      bio: user.profile?.bio,
      image: user.profile?.image,
      following: profile.profileId === user.profile.id,
    },
  };
}
