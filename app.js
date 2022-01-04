//jshint esversion:6
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
//We don't need to explicitly require passport-local since we're already requiring passport-local-mongoose.

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

mongoose.connect('mongodb://localhost:27017/userDB').then(()=>console.log("Db connected successfully"))

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User',userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

app.get('/', (req,res)=>{
    res.render('home')
})

app.get('/secrets', function(req,res){
    if(req.isAuthenticated()){
        res.render('secrets')
    }else{
        res.redirect('/login')
    }
});

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