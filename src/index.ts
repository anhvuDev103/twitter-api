import express from 'express';

import usersRouter from './routes/users.routes';

const app = express();
const port = 4000;

app.use(express.json()); //This is SANITIZE middleware -> body to json
app.use('/users', usersRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
