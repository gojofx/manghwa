import express from 'express';
export const router = express.Router();

import { router as anzManga } from './modules/anz-manga/routes'
import { router as root } from './modules/root/routes'

router.use('/anzmanga', anzManga)
router.use('/', root)
