import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import "../config/passport";

/**
 * GET /login
 * Login page.
 */
export let getLogin = (req: Request, res: Response) => {
  if (req.user) {
    return res.send(req.user);
  }
};

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    (err: Error, user: UserModel, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect("/login");
      }
      req.logIn(user, err => {
        if (err) {
          return next(err);
        }
        res.redirect(req.session.returnTo || "/");
      });
    }
  )(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
  req.logout();
  res.send("Logout successfull");
};

/**
 * GET /signup
 * Signup page.
 */
export let getSignup = (req: Request, res: Response) => {
  if (req.user) {
    return res.send(req.user);
  }
  res.send("No user login");
};

/**
 * POST /signup
 * Create a new local account.
 */
export let postSignup = (req: Request, res: Response, next: NextFunction) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      return res.redirect("/signup");
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
 * GET /account
 * Profile page.
 */
export let getAccount = (req: Request, res: Response) => {
  res.render("account/profile", {
    title: "Account Management"
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export let postUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  User.findById(req.user.id, (err, user: UserModel) => {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || "";
    user.profile.name = req.body.name || "";
    user.profile.gender = req.body.gender || "";
    user.profile.location = req.body.location || "";
    user.profile.website = req.body.website || "";
    user.save((err: WriteError) => {
      if (err) {
        if (err.code === 11000) {
          return res.redirect("/account");
        }
        return next(err);
      }
      res.redirect("/account");
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
export let postUpdatePassword = (
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
      res.redirect("/account");
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
export let postDeleteAccount = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  User.remove({ _id: req.user.id }, err => {
    if (err) {
      return next(err);
    }
    req.logout();
    res.redirect("/");
  });
};
