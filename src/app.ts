import express from "express";
import compression from "compression"; // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import lusca from "lusca";
import mongo from "connect-mongo";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

import { UserRoutes } from "./routes";
import { LoginGuard } from "./middlewares";

class App {
  public app: express.Application;
  public userRoutes: UserRoutes = new UserRoutes();
  public mongoUrl: string;
  constructor() {
    this.app = express();
    this.config();
    this.userRoutes.routes(this.app);
    this.mongoSetup();
  }
  private config(): void {
    // Express configuration
    // Load environment variables from .env file, where API keys and passwords are configured
    dotenv.config({ path: ".env" });
    this.mongoUrl = MONGODB_URI;
    this.app.set("port", process.env.PORT || 5000);
    this.app.use(compression());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    const MongoStore = mongo(session);
    this.app.use(
      session({
        resave: true,
        saveUninitialized: true,
        secret: SESSION_SECRET,
        cookie: {
          maxAge: 3600000
        },
        store: new MongoStore({
          url: this.mongoUrl,
          autoReconnect: true
        })
      })
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(lusca.xframe("SAMEORIGIN"));
    this.app.use(lusca.xssProtection(true));
    this.app.use((req, res, next) => {
      res.locals.user = req.user;
      next();
    });
    this.app.use(new LoginGuard().index());
  }
  private mongoSetup(): void {
    mongoose.Promise = bluebird;
    mongoose.set("useCreateIndex", true);
    mongoose
      .connect(
        this.mongoUrl,
        { useNewUrlParser: true }
      )
      .then(() => {
        /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
      })
      .catch(err => {
        console.log(
          "MongoDB connection error. Please make sure MongoDB is running. " +
            err
        );
        // process.exit();
      });
  }
}

export default new App().app;
