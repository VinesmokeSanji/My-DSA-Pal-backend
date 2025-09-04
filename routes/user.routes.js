const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');

// Health check route
router.get('/test', (req, res) => { 
    res.json({ message: 'User route is working fine' });
});

// User registration
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

// User login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Login attempt for user:", username);

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        // Find user
        const user = await userModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );  

        if (!token) {
            return res.status(500).json({ message: 'Error generating token' });
        }
        // console.log("Generated JWT  for user:", token);

        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userId)
            .select('-password'); // Exclude password from response
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update LeetCode username
router.post('/leetcode/username', auth, async (req, res) => {
    try {
        const { leetcodeUsername } = req.body;
        
        const user = await userModel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.leetcode = user.leetcode || {};
        user.leetcode.username = leetcodeUsername;
        user.leetcode.lastSync = new Date();
        await user.save();

        res.json({ 
            success: true,
            message: 'LeetCode username updated', 
            data: {
                username: leetcodeUsername,
                lastSync: user.leetcode.lastSync
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error updating LeetCode username', 
            error: error.message 
        });
    }
});

module.exports = router;