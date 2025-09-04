const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        ref: 'user' // ref to user model
    },
    leetcodeSubmissions: [{
        submissionId: String,
        problemName: String,
        problemDifficulty: String,
        problemTopics: [String],
        submissionCode: String,
        runtime: String,
        memory: String,
        language: String,
        code: String,
        submissionTime: Date
    }],
    aiReview: {
        insights: String,
        suggestions: String,
        improvements: String,
        timeComplexityAnalysis: String,
        spaceComplexityAnalysis: String,
        learningResources: [String]
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Index for faster querying by username
reviewSchema.index({ username: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
