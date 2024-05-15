// Import Mongoose and define schema
import mongoose from "mongoose";

const { Schema } = mongoose;

// Define payment schema
const paymentSchema = new Schema(
  {
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
    },
    razorpaySignature: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      //required: true,
    },
    currency: {
      type: String,
      //required: true,
    },
    recipient: {
      type: String,
      // required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create Payment model based on schema
const Payment = mongoose.model("Payment", paymentSchema);

// Export Payment model
export default Payment;
