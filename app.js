//jshint esversion:6
require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const app = express()

// const encrypt = require('mongoose-encryption')
// const md5 = require('md5')

const saltRounds = 10;

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/userDB').then(()=>console.log("Db connected successfully"))

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


/*Plugins are added to give extra functionalities to mongoose schemas.
userSchema.plugin(encrypt, { secret: process.env.SECRETS, encryptionFields: ['password'] }) */



const User = mongoose.model('User',userSchema)

app.get('/', (req,res)=>{
    res.render('home')
})

app.route('/register')

    .get((req,res)=>{
        res.render('register')
    })
    
    .post((req,res) =>{
        const {username, password} = req.body

        bcrypt.hash(password, saltRounds, (err, hash) =>{

            const newUser = new User({
                email: username,
                password: hash
            })
    
            newUser.save(err =>{
                if(!err){
                    res.render('secrets')
                }else{
                    console.log(err);
                }
            })

        })
        
    })

app.route('/login')
    
    .get((req,res) =>{
        res.render('login')
    })

    .post((req,res) =>{
        const {username, password} = req.body

        User.findOne({email: username},(err, foundUser) => {
            if(err){
                console.log(err);
            }else{

                bcrypt.compare(password, foundUser.password, (err, result) =>{
                    if(result){
                        res.render('secrets')
                    }
                })
                
            }
        })
    })

app.listen('3000', function(){
    console.log("App running on port 3000");
})