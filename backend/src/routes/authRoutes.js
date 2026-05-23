import express from 'express';
const router = express.Router();

// Temporary test route to fix the 404/Server error
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // This is a placeholder. Once you build your User model, 
  // you will check the database here.
  if (email === "admin@clan.org" && password === "Password123!") {
    return res.status(200).json({ name: "Administrator", token: "fake-jwt-token" });
  }
  
  return res.status(401).json({ message: "Invalid credentials" });
});

export default router;