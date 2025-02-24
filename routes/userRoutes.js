import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  resetPassword,
  forgotPassword,
  changePassword,
  updateProfile,
} from "../controllers/user.Controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isLoggedIn, getProfile);
router.post("/reset", forgotPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/change-password", isLoggedIn, changePassword);
router.post("/update", isLoggedIn, upload.single("avatar"), updateProfile);

export default router;
