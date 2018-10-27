var config = require('./lib');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var User = require('./models/User');
var port = process.env.PORT || 3000;
var passport = require('passport');
var bodyParser = require('body-parser');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');

var Mid = require('./middleware');
var mainRouter = require('./routes/main');
var usersRouter = require('./routes/user');
var groupsRouter = require('./routes/group');
var eventsRouter = require('./routes/event');
var mailRouter = require('./routes/inbox');
var imageRouter = require('./routes/images');
var  app = express();
var url;

if (process.env.NODE_ENV === 'production') {
  // url = config.DB_Prod_URI;
  url = 'mongodb://localhost:27017/showTimeDB';

}else {
  url = 'mongodb://localhost:27017/showTimeDB';
}
mongoose.connect(url,(err, db) => {
  useMongoClient: true
}, (err, db) => {
  if (err) {
    console.log(err);
  }
  console.log('Now connected to DB');
  db = db;
});

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));
app.set('view options', { layout: false });
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'config.Session_Secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());



app.use(function(err, req, res, next) {
    if(401 == err.status) {
        res.render('enter/login')
    }
});


app.use('/', mainRouter);
app.use('/group', groupsRouter);
app.use('/user', usersRouter);
app.use('/event', eventsRouter);
app.use('/inbox', mailRouter);
app.use('/upload', imageRouter);

app.listen(port, ()  => {
  console.log(`App listening on port ${port}`);
});
