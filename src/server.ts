import app from "./app";
import * as https from "https";
import * as fs from "fs";

if (process.env.NODE_ENV !== "production") {
  const errorHandler = require("errorhandler");
  app.use(errorHandler());
}

const httpsOptions = {
  key: fs.readFileSync("./config/key.pem"),
  cert: fs.readFileSync("./config/cert.pem")
};

https.createServer(httpsOptions, app).listen(app.get("port"), () => {
  console.log(
    "🚀 Server ready at https://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop");
});
