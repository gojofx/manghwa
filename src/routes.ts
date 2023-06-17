import express from 'express';
export const router = express.Router();

import { router as anzManga } from './modules/anz-manga/routes'
router.use('/anzmanga', anzManga)
