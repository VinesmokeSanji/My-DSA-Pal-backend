const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Review = require('../models/review.model');
const User = require('../models/user.model');

// Get all reviews for a user
router.get('/history/:username', auth, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Verify if the requesting user is the same as the username in params
        if (req.user.username !== username) {
            return res.status(403).json({ message: 'Unauthorized access to reviews' });
        }

        const reviews = await Review.find({ username })
            .sort({ generatedAt: -1 }); // Sort by newest first

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review history', error: error.message });
    }
});

// Generate new review from LeetCode submissions
router.post('/generate', auth, async (req, res) => {
    try {
        const { submissions, aiReview } = req.body;
        
        // Create new review document
        const review = new Review({
            username: req.user.username,
            leetcodeSubmissions: submissions,
            aiReview: aiReview
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error generating review', error: error.message });
    }
});

// Get a specific review by ID
router.get('/:reviewId', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the review belongs to the requesting user
        if (review.username !== req.user.username) {
            return res.status(403).json({ message: 'Unauthorized access to review' });
        }

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review', error: error.message });
    }
});

// Update user notes for a review
router.put('/:reviewId/notes', auth, async (req, res) => {
    try {
        const { userNotes } = req.body;
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (review.username !== req.user.username) {
            return res.status(403).json({ message: 'Unauthorized to update this review' });
        }
        review.userNotes = typeof userNotes === 'string' ? userNotes : '';
        await review.save();
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notes', error: error.message });
    }
});

module.exports = router;
