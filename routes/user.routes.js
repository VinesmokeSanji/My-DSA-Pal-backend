const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');

const userModel = require('../models/user.model');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.get('/test', (req, res) => { 
    res.send('User route is working fine');
});

router.get('/register', (req, res) => { 
    res.render('register'); 
});

router.post('/register',
    body('username').trim().isLength({ min: 3 }),
    body('email').trim().isEmail().isLength({ min: 11 }),
    body('password').trim().isLength({ min: 2 }),
    async (req, res) => { 
    
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array(), 
            message: "Invalid Data" 
        });
    }

    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); // hashing the password with salt rounds of 10

    const newUser = await userModel.create({  
        username: username,
        email: email,
        password: hashedPassword
    });
    res.json(newUser);
    
});

router.get('/login', (req, res) => { 
    res.render('login'); 
});

router.post('/login',
    body('username').trim().isLength({ min: 3 }),
    body('password').trim().isLength({ min: 2 }),
    async (req, res) => { 
    
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(), 
                message: "Invalid Data" 
            });
        }

        const { username, password } = req.body;

        const user = await userModel.findOne({
            username: username
        })

        if (!user) { 
            return res.status(400).json({
                message: "Username or Password is incorrect"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password); // comparing the password with the hashed password & return boolean value

        if(!isMatch) {
            return res.status(400).json({
                message: "Username or Password is incorrect"
            });
        }

        // if password matches then we generate a token & send it to the user
        const token = jwt.sign({
            userID: user._id,
            email: user.email,
            username: user.username
        }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // res.json({
        //     message: "User logged in successfully",
        //     token: token
        // });
        
        res.cookie('token', token); // setting the token in cookie
        res.send('User logged in successfully');
});

module.exports = router;