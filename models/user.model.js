const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ // it is a bluepriint of how our user will look like
    username:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        minlength:[3, 'Username must be at least 3 characters long']
    } ,
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        minlength:[13, 'Email must be at least 3 characters long']
    } ,
    password:{
        type: String,
        required: true,
        trim: true,
        minlength:[5, 'Password must be at least 6 characters long']    
    }
});

const user = mongoose.model('user', userSchema);    

module.exports = user;