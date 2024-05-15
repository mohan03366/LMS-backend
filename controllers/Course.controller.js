import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import fs from "fs/promises";
import cloudinary from "cloudinary";

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select("-lectures");

    res.status(200).json({
      sucess: true,
      message: "All courses",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const getLectureByCourseId = async () => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("invalid course id", 400));
    }

    res.status(200).json({
      success: true,
      message: "course lecture fetched successfullt",
      lectures: course.lectures,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const createCourse = async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fileds are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    createdBy,
    category,
  });

  if (!course) {
    return next(new AppError("course not created please try again", 400));
  }

  try {
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "server",
      });
      if (result) {
        course.thumbnails.public_id = result.url;
        course.thumbnails.secure_url = result.secure_url;
      }
      fs.rm(`uploads/${req.file.filename}`);
    }
  } catch (e) {
    return next(new AppError("file not uploaded please try again", 400));
  }
  await course.save();
  console.log(course);

  res.status(200).json({
    sucess: true,
    message: "course created successfully",
    course,
  });
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        runValidators: true,
      }
    );
    if (!course) {
      return next(new AppError("course with given id doesnot exist", 500));
    }

    res.status(200).json({
      success: true,
      message: "course updated successfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const removeCourse = async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("course with given id doesnot exist", 500));
  }
  await Course.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "course deleted successfully",
  });
};

const addLectureToCourseById = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return next(new AppError("all field are required", 400));
    }
    const { id } = req.params;

    const course = await Course.findById(id);
    console.log("your course id is->", id);

    if (!course) {
      return next(
        new AppError("course with Given courseId doesnot exixst", 500)
      );
    }
    const lectureData = {
      title,
      description,
      lecture: {},
    };
    try {
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "server",
        });
        console.log("your result is->", result);
        if (result) {
          lectureData.lecture.public_id = result.public_id;
          lectureData.lecture.secure_url = result.secure_url;
        }
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (e) {
      return next(new AppError("file not uploaded please try again", 400));
    }

    course.lectures.push(lectureData);

    course.numberOfLectures = course.lectures.length;
    await course.save();

    res.status(200).json({
      success: true,
      message: "lecture successfully added to the course",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};
export {
  getAllCourses,
  getLectureByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
};
