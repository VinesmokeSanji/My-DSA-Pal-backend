const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const generateContent = require('../service/ai.service');
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
        console.log("calling this tupid one")
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

// Route to generate a review for a single LeetCode submission with Gemini integration
router.post('/generate-single', auth, async (req, res) => {
    try {
        const { submission } = req.body;
        console.log("Received submission for review:", submission);

        if (!submission) {
            return res.status(400).json({ message: 'Submission data is required' });
        }
        if (!submission || !submission.submissionCode || !submission.problemName) {
            return res.status(400).json({ message: 'Invalid submission data' });
        }

        // Prepare the prompt for Gemini
        const prompt = `Analyze the following LeetCode submission and provide a detailed review:\n\nProblem Name: ${submission.problemName}\nDifficulty: ${submission.problemDifficulty}\nStatus: ${submission.status}\nLanguage: ${submission.language}\nCode:\n\n${submission.submissionCode}`;
        
        // Generate AI review asynchronously
        const aiReviewResponse = await generateContent(prompt);
        console.log("Raw AI Review Response:", aiReviewResponse);

        if (!aiReviewResponse) {
            return res.status(500).json({ message: 'AI review generation failed. Empty response from Gemini.' });
        }

        // Parse the AI review into structured data
        const structuredReview = parseAIReview(aiReviewResponse);
        console.log("Structured AI Review:", structuredReview);
        // Create new review document
        const review = new Review({
            username: req.user.username,
            leetcodeSubmissions: [submission],
            aiReview: structuredReview
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        console.error("Error generating review:", error);
        res.status(500).json({ message: 'Error generating review for single submission', error: error.message });
    }
});

// Update the parseAIReview function to handle the AI response properly
function parseAIReview(aiReviewResponse) {
  // Extract main sections
  const insights = extractSection(aiReviewResponse, "Summary");
  const suggestions = extractSection(aiReviewResponse, "Suggestions");
  const improvements = extractSection(aiReviewResponse, "KeyIssues");
  const timeComplexityAnalysis = extractSection(aiReviewResponse, "TimeComplexity");
  const spaceComplexityAnalysis = extractSection(aiReviewResponse, "SpaceComplexity");
  const learningResources = extractList(aiReviewResponse, "LearningResources");

  // Capture extra sections and merge them into "improvements" & "suggestions"
  const edgeCases = extractList(aiReviewResponse, "EdgeCases");
  const alternatives = extractList(aiReviewResponse, "Alternatives");
  const submissionNotes = extractSection(aiReviewResponse, "Submission Notes");
  const dsaNextTopics = extractList(aiReviewResponse, "NextTopics");
  const dsaPracticeSet = extractList(aiReviewResponse, "PracticeSet");

  // Merge extra info into improvements/suggestions so it's not lost
  let mergedImprovements = improvements;
  if (edgeCases.length > 0) {
    mergedImprovements += `\n\nEdge Cases:\n- ${edgeCases.join("\n- ")}`;
  }
  if (alternatives.length > 0) {
    mergedImprovements += `\n\nAlternatives:\n- ${alternatives.join("\n- ")}`;
  }

  let mergedSuggestions = suggestions;
  if (submissionNotes) {
    mergedSuggestions += `\n\nSubmission Notes:\n${submissionNotes}`;
  }
  if (dsaNextTopics.length > 0 || dsaPracticeSet.length > 0) {
    mergedSuggestions += `\n\nDSA Path Guidance:\nNext Topics: ${dsaNextTopics.join(", ")}\nPractice Set:\n- ${dsaPracticeSet.join("\n- ")}`;
  }

  return {
    insights,
    suggestions: mergedSuggestions.trim(),
    improvements: mergedImprovements.trim(),
    timeComplexityAnalysis,
    spaceComplexityAnalysis,
    learningResources
  };
}

// helper functions to extract sections and lists from the AI response
function extractSection(response, sectionName) {
  const regex = new RegExp(`###?\\s*${sectionName}[\\s\\S]*?(?=\\n###|$)`, "i");
  const match = response.match(regex);
  if (!match) return "";
  return match[0]
    .replace(new RegExp(`###?\\s*${sectionName}`, "i"), "")
    .trim();
}

function extractList(response, sectionName) {
  const section = extractSection(response, sectionName);
  return section
    .split("\n")
    .map(line => line.replace(/^[-*0-9.]\s*/, "").trim())
    .filter(Boolean);
}


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
