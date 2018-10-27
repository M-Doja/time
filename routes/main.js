const express = require('express');
const router = express.Router();
const socketIO = require('socket.io');
const clientio = require('socket.io-client')('http://localhost');
const http = require('http');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
const User = require('../models/User');
const Mid = require('../middleware');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const users = new Users();


/* Render Landing Page */
router.get('/', (req, res,next) => {
  res.render('index', { title: 'Showtime' , user: ''});
});

/* Render Login Form */
router.get('/login', (req, res, next) => {
  res.render('enter/login',{title:"Showtime",errMsg: '', user: '' });
});

/* Render User Register Form */
router.get('/register', (req, res, next) => {
  res.render('enter/userRegister',{title:"Showtime", errMsg: '', user: '' });
});

/* Render Group Register Form */
router.get('/register', (req, res, next) => {
  res.render('enter/groupRegister',{title:"Showtime", errMsg: '', user: '' });
});
/* GET Log Out Page*/
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/* POST Log In */
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.render('login',{ title:'Showtime', success : false, errMsg : err.message });
    }

    if (! user) {
       res.render('login',{ title:'Showtime', success : false, errMsg : 'Invalid username or password!' });
    }

    req.login(user, function(err){
      if(err){
        return res.render('login',{ title:'Showtime', success : false, errMsg : err.message });
      }
       res.redirect('/user/home');
    });
  })(req, res, next);
});

/* POST Sign Up */
router.post('/register', (req, res) => {

  User.register(new User({
    username: req.body.username,
  }),req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render('register',{title:'Showtime', errMsg: err.message});
    }
    passport.authenticate('local')(req, res, function(){
      res.redirect('/user/home');
    });
  });
});

/* Render Chat Login Form */
router.get('/chat/login' ,Mid.isLoggedIn ,(req, res,next) => {
  res.render('chat/login');
});

/* Render Chat Room  */
router.get('/chat', Mid.isLoggedIn, (req, res,next) => {
  res.render('chat/chat');
});

io.on('connection', (socket) => {
  console.log('New User Connected');
  socket.on('join', (params, cb) => {
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return cb('Name and room name are required.')
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, Mid.capitalizeName(params.name), params.room)
    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin',`Welcome to Chat Node ${Mid.capitalizeName(params.name)}`));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin',`${Mid.capitalizeName(params.name)} has joined the room`));
    cb();
  });

  socket.on('createMessage', (message, cb) => {
    var user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(Mid.capitalizeName(user.name), message.text));
    }
    cb();
  });

  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);
    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(Mid.capitalizeName(user.name), coords.latitude, coords.longitude))
    }
  });

  socket.on('disconnect', ()  => {
    var user = users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${Mid.capitalizeName(user.name)} has left.`));
    }
  });
});

module.exports = router;
