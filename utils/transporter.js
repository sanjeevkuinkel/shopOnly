import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASS,
  },
});
export { transporter };
