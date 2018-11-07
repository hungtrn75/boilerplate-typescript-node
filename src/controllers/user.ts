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
  /**
   * POST /forgot
   * Create a random token, then the send user an email with a reset link.
   */
  public postForgot = (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
      [
        function createRandomToken(done: Function) {
          crypto.randomBytes(16, (err, buf) => {
            const token = buf.toString("hex");
            done(err, token);
          });
        },
        function setRandomToken(token: AuthToken, done: Function) {
          User.findOne({ email: req.body.email }, (err, user: any) => {
            if (err) {
              return done(err);
            }
            if (!user) {
              return res.status(404).send({
                error: "Account with that email address does not exist."
              });
            }
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
            user.save((err: WriteError) => {
              done(err, token, user);
            });
          });
        },
        function sendForgotPasswordEmail(
          token: AuthToken,
          user: UserModel,
          done: Function
        ) {
          const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASSWORD
            }
          });
          const mailOptions = {
            to: user.email,
            from: "hackathon@starter.com",
            subject: "Reset your password on Hackathon Starter",
            text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
          };
          transporter.sendMail(mailOptions, err => {
            done(err);
          });
          res.send({
            message:
              "An email has been sent to your email. Please check your email to reset password"
          });
        }
      ],
      err => {
        if (err) {
          return next(err);
        }
      }
    );
  };
  /**
   * POST /reset/:token
   * Process the reset password request.
   */
  public postReset = (req: Request, res: Response, next: NextFunction) => {
    async.waterfall(
      [
        function resetPassword(done: Function) {
          User.findOne({ passwordResetToken: req.params.token })
            .where("passwordResetExpires")
            .gt(Date.now())
            .exec((err, user: any) => {
              if (err) {
                return next(err);
              }
              if (!user) {
                return res
                  .status(404)
                  .send({
                    error: "Password reset token is invalid or has expired."
                  });
              }
              user.password = req.body.password;
              user.passwordResetToken = undefined;
              user.passwordResetExpires = undefined;
              user.save((err: WriteError) => {
                if (err) {
                  return next(err);
                }
                req.logIn(user, err => {
                  done(err, user);
                });
              });
            });
        },
        function sendResetPasswordEmail(user: UserModel, done: Function) {
          const transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.SENDGRID_USER,
              pass: process.env.SENDGRID_PASSWORD
            }
          });
          const mailOptions = {
            to: user.email,
            from: "express-ts@starter.com",
            subject: "Your password has been changed",
            text: `Hello,\n\nThis is a confirmation that the password for your account ${
              user.email
            } has just been changed.\n`
          };
          transporter.sendMail(mailOptions, err => {
            res.send({ message: "Success! Your password has been changed." });
            done(err);
          });
        }
      ],
      err => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      }
    );
  };
}
