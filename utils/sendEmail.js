import nodemailer from 'nodemailer';

const sendEmail = async function(email, subject, message) {
  console.log("email:", process.env.SMTP_USERNAME)
  console.log("password:", process.env.SMTP_PASSWORD)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // Adjust based on your SMTP configuration
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to:email,
      subject: subject,
      html: message,
    });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendEmail;
