import express from "express";
export const router = express.Router();
import * as controller from './controllers'
import { exceptionHandler } from "../../util/exceptionHandler";

router.get('/findByName', exceptionHandler(controller.findByName))
router.get('/findChaptersByName', exceptionHandler(controller.findChaptersByName))
router.get('/findChapter', exceptionHandler(controller.findChapter))
router.get('/downloadChapterPdf', exceptionHandler(controller.downloadChapterPdf))