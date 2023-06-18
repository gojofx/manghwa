import express from "express";
export const router = express.Router();
import * as controller from './controllers'
import { exceptionHandler } from "../../util/exceptionHandler";

router.get('/', exceptionHandler(controller.root))
