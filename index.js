const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');
const keys = require('./config/keys');
const dev = require('./config/dev');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('./models/Survey');
require('./models/User');
require('./services/passport');
const app = express();

app.use(bodyParser.json());
app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [dev.cookieKey],
	})
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(dev.mongoURI);

require('./routes/authRoutes')(app);
require('./routes/billingRoutes')(app);
require('./routes/surveyRoutes')(app);
const PORT = process.env.PORT || 5000;
app.listen(PORT);
