import express from 'express';
import 'dotenv/config';

import usersRouter from './routes/users.routes';
import mediasRouter from './routes/medias.routes';
import staticRouter from './routes/static.routes';
import databaseService from './services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import { initFolder } from '@utils/files';
import { UPLOAD_TEMP_DIR } from '@constants/configs';

const app = express();
const port = process.env.PORT || 4000;

initFolder(UPLOAD_TEMP_DIR);

app.use(express.json()); //This is SANITIZE middleware -> body to json
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
// app.use('/static', express.static(UPLOAD_DIR));

databaseService.connect();

app.use(defaultErrorHandler);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
