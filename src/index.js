const express = require("express");
require('dotenv').config();
require("./db/mongoose");

var cors = require('cors')
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const app = express();

const port = process.env.PORT;
console.log(port);
app.use(cors())
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
