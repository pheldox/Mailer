const sgMail = require('@sendgrid/mail');

const keys = require('../config/dev');

module.exports = async ({ subject, recipients }, content) => {
	// using SendGrid's v3 Node.js Library
	// https://github.com/sendgrid/sendgrid-nodejs
	sgMail.setApiKey(keys.sendGridKey);

	const formattedRecipients = recipients.map(({ email }) => email);
	const msg = {
		to: formattedRecipients,
		from: 'felixaryee4@gmail.com',
		subject: subject,
		html: content,
	};
	try {
		await sgMail.send(msg);
	} catch (error) {
		console.log(error);
	}
};
