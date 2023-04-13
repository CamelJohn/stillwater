import express from "express";
import { articleRouter } from "../modules/article";
import { authRouter } from "../modules/auth";
import { profileRouter } from "../modules/profile";
import { userRouter } from "../modules/user";

export const webRouter = express.Router();

webRouter.use('/auth', authRouter);
webRouter.use('/user', userRouter);
webRouter.use('/profile', profileRouter);
webRouter.use('/article', articleRouter);