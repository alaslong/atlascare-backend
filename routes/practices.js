const express = require('express');
const { createClient } = require('../lib/supabase'); // Import your createClient function
const router = express.Router();

// Route to fetch all practices by client_id
router.get('/practices', async (req, res, next) => {
  try {
    const supabase = createClient({ req, res });
    const { client_id } = req.query;

    if (!client_id) {
      return res.status(400).json({ message: 'client_id is required' });
    }

    // Query the `client_practices` table to get all practices for the client_id
    const { data: practices, error } = await supabase
      .from('client_practices')
      .select('*')
      .eq('client_id', client_id);

    if (error) {
      console.error('Error fetching practices:', error);
      return res.status(500).json({ message: 'Error fetching practices', error });
    }

    // Return the practices in the response
    res.status(200).json({
      message: 'Practices fetched successfully',
      practices, 
    });
  } catch (error) {
    console.error('Error in /practices route:', error);
    next(error);
  }
});

// Route to fetch a single practice by practice_id
router.get('/practice', async (req, res, next) => {
  try {
    const supabase = createClient({ req, res });
    const { practice_id } = req.query;

    if (!practice_id) {
      return res.status(400).json({ message: 'practice_id is required' });
    }

    // Query the `client_practices` table to get a specific practice by practice_id
    const { data: practice, error } = await supabase
      .from('client_practices')
      .select('*')
      .eq('id', practice_id)
      .single();

    if (error) {
      console.error('Error fetching practice:', error);
      return res.status(500).json({ message: 'Error fetching practice', error });
    }

    // Return the practice data in the response
    res.status(200).json({
      message: 'Practice fetched successfully',
      practice,
    });
  } catch (error) {
    console.error('Error in /practice route:', error);
    next(error);
  }
});

module.exports = router;
