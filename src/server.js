const express = require("express");
const app = express();
const initRoutes = require("./routes/routes");

initRoutes(app)
let port = 8080;

app.listen(port,() => console.log("Connection established sucessfully"));
