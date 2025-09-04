
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/user.model');
const { LeetCode, Credential } = require('leetcode-query');

// Store LeetCode credentials for users
const userCredentials = new Map();

// Helper function to get or create LeetCode client for user
async function getLeetCodeClient(sessionToken) {
    const credential = new Credential();
    await credential.init(sessionToken);
    return new LeetCode(credential);
}

// Set LeetCode session token for user
router.post('/set-session', auth, async (req, res) => {
    try {
        const { sessionToken } = req.body;
        
        if (!sessionToken) {
            return res.status(400).json({ error: "Missing LeetCode session token" });
        }

        // Validate token by trying to fetch user data
        const lc = await getLeetCodeClient(sessionToken);
        await lc.submissions({ limit: 1 }); // Test the token

        // Persist token to memory and DB for the user
        userCredentials.set(req.user.userId, sessionToken);

        const user = await User.findById(req.user.userId);
        if (user) {
            user.leetcode = user.leetcode || {};
            user.leetcode.sessionID = sessionToken;
            user.leetcode.lastSync = new Date();

            // Try to pull profile basics immediately for convenience
            try {
                const status = await lc.userStatus();
                if (status) {
                    user.leetcode.username = status.username;
                    const total = status.submitStats?.acSubmissionNum?.find?.(s => s.difficulty === 'All')?.count || 0;
                    user.leetcode.totalSolved = total;
                }
            } catch (_) { /* optional; ignore */ }

            await user.save();
        }

        res.json({ success: true, message: "LeetCode session saved", persisted: true });
    } catch (error) {
        res.status(400).json({ error: "Invalid LeetCode session token" });
    }
});

router.post('/fetch-submissions', auth, async (req, res) => {
    console.log('Received request body:', req.body);
    const { sessionToken, limit = 20 } = req.body;
    
    if (!sessionToken) {
        return res.status(400).json({ error: "Missing session token" });
    }
    console.log("Received request with sessionToken:", sessionToken ? "Provided" : "Missing", "and limit:", limit);
    if (!sessionToken) {
        return res.status(400).json({ error: "Missing LeetCode session token" });
    }

    try {
        // Auth using session token
        const credential = new Credential();
        await credential.init(sessionToken);

        const lc = new LeetCode(credential);

        // Fetch submissions
        const submissions = await lc.submissions({ limit });

        // Fetch full details for each submission
        const detailedSubmissions = await Promise.all(
            submissions.map(async (sub) => {
                const detail = await lc.submission(sub.id);
                return {
                    id: sub.id,
                    problem: sub.title,
                    submitted: new Date(sub.timestamp).toLocaleString(),
                    status: sub.statusDisplay,
                    runtime: sub.runtime,
                    memory: sub.memory,
                    language: sub.lang,
                    code: detail.code
                };
            })
        );

        // Update user's last sync time
        const user = await User.findById(req.user.userId);
        if (user) {
            user.leetcode.lastSync = new Date();
            await user.save();
        }

        res.json({ success: true, submissions: detailedSubmissions });
    } catch (err) {
        console.error("Failed to fetch submissions:", err);
        res.status(500).json({ error: "Failed to fetch submissions", details: err.message });
    }
});

// Get user's LeetCode profile
router.get('/profile', auth, async (req, res) => {
    try {
        const sessionToken = userCredentials.get(req.user.userId);
        if (!sessionToken) {
            return res.status(400).json({ error: "LeetCode session not set" });
        }

        const lc = await getLeetCodeClient(sessionToken);
        const userStatus = await lc.userStatus();
        
        if (userStatus) {
            // Update user's LeetCode info in our database
            const user = await User.findById(req.user.userId);
            if (user) {
                user.leetcode.username = userStatus.username;
                user.leetcode.totalSolved = userStatus.submitStats.acSubmissionNum.find(
                    stat => stat.difficulty === 'All'
                )?.count || 0;
                await user.save();
            }

            res.json({
                success: true,
                profile: {
                    username: userStatus.username,
                    ranking: userStatus.profile.ranking,
                    totalSolved: user.leetcode.totalSolved,
                    submitStats: userStatus.submitStats
                }
            });
        } else {
            res.status(404).json({ error: "LeetCode profile not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch LeetCode profile", details: error.message });
    }
});

// Get specific submission details
router.get('/submission/:id', auth, async (req, res) => {
    try {
        const sessionToken = userCredentials.get(req.user.userId);
        if (!sessionToken) {
            return res.status(400).json({ error: "LeetCode session not set" });
        }

        const lc = await getLeetCodeClient(sessionToken);
        const submission = await lc.submission(req.params.id);
        
        if (submission) {
            res.json({
                success: true,
                submission: {
                    id: submission.id,
                    problem: submission.title,
                    submitted: new Date(submission.timestamp).toLocaleString(),
                    status: submission.statusDisplay,
                    runtime: submission.runtime,
                    memory: submission.memory,
                    language: submission.lang,
                    code: submission.code
                }
            });
        } else {
            res.status(404).json({ error: "Submission not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch submission", details: error.message });
    }
});

module.exports = router;
