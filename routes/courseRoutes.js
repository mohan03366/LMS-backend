import { Router } from "express";
import {
  getAllCourses,
  getLectureByCourseId,
  updateCourse,
  createCourse,
  removeCourse,
  addLectureToCourseById,
} from "../controllers/Course.controller.js";
import {
  authorizedRoles,
  isLoggedIn,
  authorizedSubscriber,
} from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router();

router.route("/").get(getAllCourses).post(
  isLoggedIn,

  authorizedRoles("ADMIN"),
  upload.single("thumbnail"),
  createCourse
);

router
  .route("/:id")
  .get(isLoggedIn, authorizedSubscriber, getLectureByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLectureToCourseById
  );

export default router;
