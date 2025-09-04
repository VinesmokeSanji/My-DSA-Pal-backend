const express = require('express');
const app = express();
const userRoutes = require('./routes/user.routes');
const dotenv = require('dotenv');

dotenv.config(); // this method will allow all our files to read the .env file contents


const connectToDB = require('./config/db');
connectToDB();

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended:true })); // to parse form data 



app.use('/user', userRoutes); 


app.listen(3000, ()=>{
    console.log('Server is running on port 3000');
});