import express, { NextFunction, Request, Response } from "express";
import { db } from "../../database/database";
import { mapTagsDomainToContract } from "./mappers";

export const tagRouter = express.Router();

tagRouter.get("", async (req: Request, res: Response, next: NextFunction) => {
    const tags = await db.models.tag.findAll();

    res.status(200).send(mapTagsDomainToContract(tags))
});
