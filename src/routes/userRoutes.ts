import { UserController } from "../controllers";

// API keys and Passport configuration
import * as passportConfig from "../config/passport";

export class UserRoutes {
  public userController: UserController = new UserController();
  public routes(app: any): void {
    app
      .route("/login")
      .get(this.userController.getLogin)
      .post(this.userController.postLogin);
    app.route("/logout").get(this.userController.logout);
    app
      .route("/signup")
      .get(this.userController.getSignup)
      .post(this.userController.postSignup);
    app
      .route("/account")
      .post(
        passportConfig.isAuthenticated,
        this.userController.postUpdatePassword
      );
    app
      .route("/account/delete")
      .delete(
        passportConfig.isAuthenticated,
        this.userController.postDeleteAccount
      );
  }
}
