export function authDomainToContract(user: any) {
    return {
      user: {
        email: user?.email,
        token: user?.token,
        username: user?.username,
        bio: user?.Profile?.bio,
        image: user?.Profile?.image,
      },
    };
  }