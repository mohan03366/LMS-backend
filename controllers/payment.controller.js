import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";

export const getRazorpayApiKey = async (res, req, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay API key",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const buySubscription = async (res, req, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("unauthorized please login"));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchased a subscriptions", 400));
    }
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
    });

    (user.subscription.id = subscription.id),
      (user.subscription.status = subscription.status);

    await user.save();

    res.status(200).json({
      success: true,
      message: "subcribed successfully",
      subscription_id: subscription.id,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const verifySubscription = async (res, req, next) => {
  try {
    const { id } = req.user;
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } =
      req.body;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("unauthorized please login"));
    }

    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpayPaymentId}|${subscriptionId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return next(
        new AppError("payment not verified , please try again ", 500)
      );
    }

    await Payment.create({
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
    });
    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "payment verified successfully!",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const cancelSubscription = async (res, req, next) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("unauthorized please login"));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchased a subscriptions", 400));
    }
    const subscriptionId = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionId);

    user.subscription.status = subscription.status;
    await user.save();
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const allPayment = async (res, req, next) => {
  const { count } = req.query;

  const subscribtions = await razorpay.subscriptions.all({
    count: count || 10,
  });

  res.status(200).json({
    success: true,
    message: "All Payments",
    subscribtions,
  });
};
