import app from "./app";

if (process.env.NODE_ENV !== "production") {
  const errorHandler = require("errorhandler");
  app.use(errorHandler());
}

const server = app.listen(app.get("port"), () => {
  console.log(
    "🚀 Server ready at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop");
});

export default server;
