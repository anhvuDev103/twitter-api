import express from 'express';
import 'dotenv/config';

import usersRouter from './routes/users.routes';
import databaseService from './services/database.services';

const app = express();
const port = 4000;

app.use(express.json()); //This is SANITIZE middleware -> body to json
app.use('/users', usersRouter);

databaseService.connect();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
