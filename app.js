import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js";
import courseRoute from "./routes/courseRoutes.js";
import paymentRoute from "./routes/paymentRoutes.js";
import errorMiddleware from "./middleware/error.Middleware.js";
import miscRoutes from "./routes/miscellaneousRoutes.js";

const app = express();

//middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("p..ong");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/misc", miscRoutes);

app.use("*", (req, res) => {
  res.status(404).send("OOPS!! 404 page not found");
});

app.use(errorMiddleware);
export default app;
// {
//   // origin: [process.env.FRONTED_URL],

//  }
