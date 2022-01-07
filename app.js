//jshint esversion:6
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
//We don't need to explicitly require passport-local since we're already requiring passport-local-mongoose.
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')

app.use(session({
    secret: 'This is testing.',
    resave: false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB')

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model('User',userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get('/', (req,res)=>{
    res.render('home')
})

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })
)

app.get('/auth/google/secrets',
    passport.authenticate('google', {failureRedirect: '/login'}),
    function(req, res){
        res.redirect('/secrets')
    }
)


app.get('/secrets', function(req,res){
    User.find({'secret': {$ne: null}}, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                res.render('secrets', {usersWithSecrets: foundUser})
            }
        }
    })
});

app.route('/submit')

    .get(function(req,res){
        if(req.isAuthenticated()){
            res.render('submit')
        }else{
            res.redirect('/login')
        }
    })

    .post(function(req,res){
    
        const id = req.user.id;
        const submittedSecret = req.body.secret
        
        User.findById(id, function(err, foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    foundUser.secret = submittedSecret;
                    foundUser.save(function(){
                        res.redirect('/secrets')
                    })
                }
            }
        })

        console.log(req.user);
    })

app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/');
})

app.route('/register')

    .get((req,res)=>{
        res.render('register')
    })
    
    .post((req,res) =>{
        const {username, password} = req.body
        
        User.register({username: username}, password, function(err,user){
            if(err){
                console.log(err);
                res.redirect('/register')
            }else{
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets')
                })
            }
        })
    })

app.route('/login')
    
    .get((req,res) =>{
        res.render('login')
    })

    .post((req,res) =>{
        const {username, password} = req.body

        const user = new User({
            username: username,
            password: password
        })

        //req.logIn is given by passport.
        req.logIn(user, function(err){
            if(err){
                console.log(err);
            }else{
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets')
                })
            }
        })
    })

app.listen('3000', function(){
    console.log("App running on port 3000");
})