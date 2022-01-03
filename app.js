//jshint esversion:6
const express = require('express')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/userDB').then(()=>console.log("Db connected successfully"))

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const secret = 'Thisismysecret.'

//Plugins are added to give extra functionalities to mongoose schemas.
userSchema.plugin(encrypt, { secret: secret, encryptionFields: ['password'] })

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
        
        const newUser = new User({
            email: username,
            password: password
        })

        newUser.save(err =>{
            if(!err){
                res.render('secrets')
            }else{
                console.log(err);
            }
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
                if(foundUser.password === password){
                    res.render('secrets')
                }
            }
        })
    })

app.listen('3000', function(){
    console.log("App running on port 3000");
})