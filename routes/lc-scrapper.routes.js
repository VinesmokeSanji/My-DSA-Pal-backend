
const { LeetCode, Credential } = require('leetcode-query');
const express = require('express');
const router = express.Router();

// const { body, validationResult } = require('express-validator');



router.post('/fetch-submissions', async (req, res) => {
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

        res.json({ success: true, submissions: detailedSubmissions });
    } catch (err) {
        console.error("Failed to fetch submissions:", err);
        res.status(500).json({ error: "Failed to fetch submissions", details: err.message });
    }
});

module.exports = router;
