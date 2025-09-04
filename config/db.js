const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MONGO_URI } = require('./constants');


function connectDB() {
    mongoose.connect(MONGO_URI).then(() => { console.log('Connected to MongoDB'); })
}

module.exports = connectDB;