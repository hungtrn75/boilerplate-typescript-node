import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import "../config/passport";

export class UserController {
  /**
   * GET /login
   * Login page.
   */
  public getLogin = (req: Request, res: Response) => {
    if (req.user) {
      return res.send(req.user);
    } else {
      return res.status(404).send("No user was logined");
    }
  };

  /**
   * POST /login
   * Sign in using email and password.
   */
  public postLogin = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: Error, user: UserModel, info: IVerifyOptions) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(404).send("Email or password incorrect!");
        }
        req.logIn(user, err => {
          if (err) {
            return next(err);
          }
          res.send(user);
        });
      }
    )(req, res, next);
  };

  /**
   * GET /logout
   * Log out.
   */
  public logout = (req: Request, res: Response) => {
    req.logout();
    res.send("Logout successfull");
  };

  /**
   * GET /signup
   * Signup page.
   */
  public getSignup = (req: Request, res: Response) => {
    if (req.user) {
      return res.send(req.user);
    }
    res.send("No user login");
  };

  /**
   * POST /signup
   * Create a new local account.
   */
  public postSignup = (req: Request, res: Response, next: NextFunction) => {
    const user = new User({
      email: req.body.email,
      password: req.body.password
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
      if (err) {
        return next(err);
      }
      if (existingUser) {
        return res.status(404);
      }
      user.save(err => {
        if (err) {
          return next(err);
        }
        req.logIn(user, err => {
          if (err) {
            return next(err);
          }
          res.send(user);
        });
      });
    });
  };

  /**
   * POST /account/password
   * Update current password.
   */
  public postUpdatePassword = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    User.findById(req.user.id, (err, user: UserModel) => {
      if (err) {
        return next(err);
      }
      user.password = req.body.password;
      user.save((err: WriteError) => {
        if (err) {
          return next(err);
        }
        res.send("Changed your password successfully!");
      });
    });
  };

  /**
   * POST /account/delete
   * Delete user account.
   */
  public postDeleteAccount = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    User.remove({ _id: req.user.id }, err => {
      if (err) {
        return next(err);
      }
      req.logout();
      res.send("Deleted your account!");
    });
  };
}
