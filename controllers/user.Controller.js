import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import User from "../models/user.model.js";
import fs from "fs/promises";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
  httpOnly: true,
  secure: true, // Set to false for local testing without HTTPS
  maxAge: 7 * 24 * 60 * 60 * 1000, // 1 hour expiration time
  // Other options like domain, path, etc. can be added if needed
};

const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;
  console.log(req.body);

  if (!fullName || !email || !password) {
    return next(new AppError("All field are required", 400));
  }

  const userExist = await User.findOne({ email });
  if (userExist) {
    return next(new AppError("Email already exists", 400));
  }

  // Create new user with the given necessary data and save to DB
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
    },
  });

  // If user not created send message response
  if (!user) {
    return next(
      new AppError("User registration failed, please try again later", 400)
    );
  }

  // Run only if user sends a file
  console.log("file", req.file);
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "server", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || "File not uploaded, please try again", 400)
      );
    }
  }
  // user.comparePassword(password);

  // Save the user object
  await user.save();

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie("token", token, cookieOptions);

  // If all good send the response to the frontend
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Every field is required", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new AppError("User not found", 400));
    }
    const checkPassword = await user.comparePassword(password);
    if (!checkPassword) {
      return next(new AppError("email or password does not match", 400));
    }

    const token = await user.generateJWTToken();
    console.log("your token generated is : ", token);

    user.password = undefined;

    res.cookie("token", token, cookieOptions);
    res.status(201).json({
      success: true,
      message: "user loggedIn successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 400));
  }
};

const logout = (req, res) => {
  res.cookie("token", null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });
  res.status(201).json({
    success: true,
    message: "User loggedOut successfully",
  });
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: " User details",
      user,
    });
  } catch (e) {
    return next(new AppError("failed to fetch profile", 400));
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("email doesnot match", 400));
  }

  const resetToken = user.generatePasswordResetToken();
  console.log(resetToken);

  await user.save();

  const resetPasswordURL = `${process.env.FRONTED_URL}/reset-password/${resetToken}`;
  console.log(resetPasswordURL);

  const subject = "Reset password";

  const message = `you can  reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password </a>\nIfthe above link`;

  try {
    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `reset password has been sent to ${email} successfully`,
    });
  } catch (e) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(new AppError(e.message, 500));
  }
};

const resetPassword = async (req, res, next) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("token is invalid or expired please try again", 400)
    );
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.save();

  res.status(200).json({
    success: true,
    message: "password changed successfully!",
  });
};
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Assuming you have user authentication middleware

  try {
    // Find the user by ID
    const user = await User.findById(userId).select("+password");

    // Check if the current password matches the user's password
    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new AppError("Incorrect current password", 401));
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const updateProfile = async (req, res, next) => {
  const { fullName } = req.body;
  const { id } = req.user.id;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("user doesnot exist", 500));
  }

  if (req.fullName) {
    user.fullName = fullName;
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "server", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.unlink(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || "File not uploaded, please try again", 400)
      );
    }
  }

  user.save();
  res.status(200).json({
    success: true,
    message: "user details updated successfully",
  });
};

export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};
