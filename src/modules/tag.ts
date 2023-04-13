import express, { NextFunction, Request, Response } from "express";
import { db } from "../database/database";
import { getUserFromToken } from "../helpers/helpers";
import { IsLoggedIn, Validate } from "../server/middleware";
import { BadRequest, Unauthorized } from "http-errors";

const tagRouter = express.Router();

tagRouter.get("/tag");
