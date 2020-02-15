const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../config/mailer.json');

const transport = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass }
});

const handlebarOptions = {
    viewEngine: {
      extName: '.html',
      partialsDir: path.resolve('./src/resources/mail/'),
      layoutsDir: path.resolve('./src/resources/mail/'),
      defaultLayout: 'auth/forgot_password.html',
    },
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html',
};

transport.use('compile', hbs(handlebarOptions));

module.exports = transport;