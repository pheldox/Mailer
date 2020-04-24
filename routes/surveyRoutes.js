const mongoose = require('mongoose');
const _ = require('lodash');
const { URL } = require('url');
const { Path } = require('path-parser');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');
const Survey = mongoose.model('surveys');

module.exports = (app) => {
	app.get('/api/surveys', requireLogin, async (req, res) => {
		// return only suveys and discard recipieints
		const surveys = await Survey.find({ _user: req.user.id }).select({
			recipients: false,
		});
		res.send(surveys);
	});

	app.get('/api/surveys/:surveysId/:choice', (req, res) => {
		res.send('Thanks for voting!');
		console.log(res.data);
	});

	app.post('/api/surveys/webhooks', (req, res) => {
		_.chain(req.body)
			.map(({ url, email }) => {
				const p = new Path('/api/surveys/:surveyId/:choice');
				const match = p.test(new URL(url).pathname);
				if (match) {
					return { email, surveyId: match.surveyId, choice: match.choice };
				}
			})
			.compact()
			.uniqBy('email', 'surveyId')
			.each(({ surveyId, email, choice }) => {
				Survey.updateOne(
					{
						_id: surveyId,
						recipients: {
							$elemMatch: { email: email, responded: false },
						},
					},
					{
						$inc: { [choice]: 1 },
						$set: { 'recipients.$.responded': true },
						lastResponded: new Date(),
					}
				).exec();
			})
			.value();

		res.send({});
	});

	app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
		const { title, subject, body, recipients } = req.body;
		const survey = new Survey({
			title,
			subject,
			body,
			recipients: recipients
				.split(',')
				.map((email) => ({ email: email.trim() })),
			_user: req.user.id,
			dateSent: Date.now(),
		});
		try {
			Mailer(survey, surveyTemplate(survey));
			await survey.save();
			req.user.credits -= 1;
			const user = await req.user.save();

			res.send(user);
		} catch (err) {
			res.status(422).send(err);
		}
	});
};
