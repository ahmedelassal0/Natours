const path = require('path');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');

module.exports = class {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ahmed Elassal <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') return 1;
    else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }
  async send(template, subject) {
    // 1) render the template
    const html = ejs.renderFile(
      path.join(__dirname, `./../views/emails/${template}.ejs`),
      { receiver: this.firstName, subject, url: this.url },
      (err, data) => {
        if (err) console.log(err);
      }
    );

    // 2) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    };
    // create transport and send email
    this.newTransport().sendMail(mailOptions, (err, data) => {
      if (err) console.log(err);
    });
  }
  async sendWelcome() {
    await this.send('welcome', 'welcome to Natours family');
  }
};
