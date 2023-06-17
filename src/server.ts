import express from 'express';
import { router } from './routes'
import { exceptionMiddleware } from './util/exceptionMiddleware'

const app = express();
const port = 4000;
const path = '/api'

app.use( path, router );
router.use(exceptionMiddleware)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app