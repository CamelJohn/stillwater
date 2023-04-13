import type { NextFunction, Request, Response } from "express";
import { NotFound, Conflict, Unauthorized, isHttpError } from "http-errors";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { ValidationKey, ValidationSchema } from "../services/validation";

export async function HealthCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(200).send("Ok");
}

export async function CatchAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(new NotFound("the route you are looking for does not exist."));
}

export async function Error(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (isHttpError(error)) {
    const formattedErrorName = error.name.replace("Error", "");
    return res
      .status(error.status)
      .send(`${formattedErrorName}: ${error.message}`);
  }
  res.status(500).send("something went wrong");
}

export function Validate(keys: ValidationKey[]) {
  return keys.map((key) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const { schema, target, error } = ValidationSchema[key];

      const isValid = schema.validate(req[target]);

      if (!isValid.error) {
        return next();
      }

      return next(error(isValid.error.message));
    };
  });
}

export async function CanRegister(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const exists = await db.models.User.findOne({
    where: { email: req.body.user.email },
  });

  if (!exists) {
    return next();
  }

  next(new Conflict("email already taken."));
}

export async function CanLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const exists = await db.models.User.findOne({
    where: { email: req.body.user.email },
  });

  if (!exists) {
    return next(new Unauthorized("invalid credentials."));
  }

  return next();
}

export async function IsLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return next(new Unauthorized("Invalid credentials."));
  }

  next();
}
