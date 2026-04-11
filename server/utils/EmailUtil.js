const nodemailer = require("nodemailer");
const MyConstants = require("./MyConstants");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MyConstants.EMAIL_USER,
    pass: MyConstants.EMAIL_PASS
  }
});
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});

const EmailUtil = {
  send(email, id, token) {
    const activeUrl = `${MyConstants.CLIENT_CUSTOMER_URL}/active?id=${id}&token=${token}`;
    const text =
      'Thanks for signing up at Cake House.\n' +
      'Open this link to activate your account:\n' +
      `${activeUrl}\n\n` +
      'Or enter these details on the activation page:\n' +
      '\t- id: ' + id + '\n' +
      '\t- token: ' + token;

    return new Promise((resolve, reject) => {
      const mailOptions = {
        from: MyConstants.EMAIL_USER,
        to: email,
        subject: 'Signup | Verification',
        text: text
      };

      transporter.sendMail(mailOptions, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
};

module.exports = EmailUtil;
