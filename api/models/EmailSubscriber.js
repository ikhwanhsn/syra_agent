import mongoose from "mongoose";

const emailSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    emailKey: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
      index: true,
    },
    source: { type: String, default: "kol_page" },
    unsubscribeToken: { type: String, required: true, unique: true, index: true },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

emailSubscriberSchema.index({ status: 1, createdAt: -1 });

const EmailSubscriber =
  mongoose.models.EmailSubscriber ||
  mongoose.model("EmailSubscriber", emailSubscriberSchema);

export default EmailSubscriber;
