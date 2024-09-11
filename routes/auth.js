// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const { createClient } = require('../lib/supabase'); // Import your createClient function
const router = express.Router();
require('dotenv').config();

// Login route
router.post('/login', async function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const supabase = createClient({ req, res });
    
    // Authenticate the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    // Now fetch the user data from the custom view based on the email
    const { data: userData, error: viewError } = await supabase
      .from('user_contact_view') // Supabase view that combines user and contact data
      .select('*')
      .eq('email', email)
      .single(); // Since we're only expecting one record

    if (viewError) {
      return res.status(500).json({ message: 'Error fetching user data from view', error: viewError });
    }

    // Return the custom user data along with tokens
    res.status(200).json({ 
      message: "Login successful", 
      user: userData,  // Data from the Supabase view
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });
  } catch (error) {
    next(error);  // Handle unexpected errors
  }
});


// Verify token route and fetch user data from Supabase view
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get the token part after 'Bearer '

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  // Verify the token using the JWT secret from Supabase
  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    try {
      // Pass req and res to createClient for SSR
      const supabase = createClient({ req, res }); // Ensure req and res are passed

      const { data: userData, error } = await supabase
        .from('user_contact_view')
        .select('*')
        .eq('email', decoded.email)
        .single();

      if (error) {
        return res.status(500).json({ message: 'Error fetching user data', error });
      }

      // Token is valid, send back the user data
      res.status(200).json({
        message: 'Token is valid',
        user: userData // Return user data from the view
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user data', error });
    }
  });
});


router.post('/refresh', async function (req, res, next) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const supabase = createClient({ req, res });
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Return the new access token and refresh token
    res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    next(error);  // Handle unexpected errors
  }
});

module.exports = router;
