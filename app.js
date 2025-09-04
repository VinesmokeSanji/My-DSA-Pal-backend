const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // load .env BEFORE requiring any local modules
const app = express();
const userRoutes = require('./routes/user.routes');
const reviewRoutes = require('./routes/review.routes');
const sessionRoutes = require('./routes/session.routes');
const lcScraperRoutes = require('./routes/lc-scrapper.routes');
const aiRoutes = require('./routes/ai.routes');

// CORS Configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});


const connectToDB = require('./config/db');
connectToDB();

// built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended:true })); // to parse form data



app.use('/user', userRoutes); 
app.use('/ai', aiRoutes);
app.use('/review', reviewRoutes);
app.use('/session', sessionRoutes);
app.use('/leetcode', lcScraperRoutes);

app.listen(3000, ()=>{
    console.log('Server is running on port http://localhost:3000');
});