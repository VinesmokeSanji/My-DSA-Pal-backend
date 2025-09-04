const jwt = require('jsonwebtoken');

// custom middleware to verify the token
function auth(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        req.user = decoded; 
        return next(); 

    }
    catch(err) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
}

module.exports = auth;