import express from "express";
export const router = express.Router();
import * as controller from './controllers'
import { exceptionHandler } from "../../util/exceptionHandler";

router.get('/', exceptionHandler(controller.root))

router.get('/findByName', exceptionHandler(controller.findByName))

router.get('/findChaptersByName', exceptionHandler(controller.findChaptersByName))

router.get('/findImagesChapter', exceptionHandler(controller.findImagesChapter))

router.get('/downloadChapterPdf', exceptionHandler(controller.downloadChapterPdf))

router.get('/generateZip', exceptionHandler(controller.generateZip))