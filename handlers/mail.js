const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

// transport.sendMail({
//   from: 'Wes Bos <wes@gmail.com>',
//   to: 'some@exx.com',
//   subject: 'Testing emails',
//   html: 'Hey, <strong>Friend</strong>',
//   text: 'Hey **friend**'
// });

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlined = juice(html);
  return inlined;
}

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: `Wes Bos <nono@aaa.com`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  
  const sendMail = promisify(transport.sendMail, transport);

  return sendMail(mailOptions);
}