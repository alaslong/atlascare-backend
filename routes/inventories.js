const express = require('express');
const router = express.Router();
const { createClient } = require('../lib/supabase'); // Assuming you have a supabase client

// Route to get all product stock for a client practice by client_practice_id
router.get('/inventory', async (req, res, next) => {
  const { client_practice_id } = req.query; // Get client_practice_id from query parameters

  if (!client_practice_id) {
    return res.status(400).json({ message: 'client_practice_id is required' });
  }

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Fetching the product stock from the `client_practice_product_stock` view
    const { data, error } = await supabase
      .from('client_practice_product_stock') // Use the new view name
      .select('*')
      .eq('client_practice_id', client_practice_id); // Filter by client_practice_id

    if (error) {
      return res.status(500).json({ message: 'Error fetching product stock', error });
    }

    // Return the fetched data
    res.status(200).json({ inventory: data });
  } catch (error) {
    next(error); // Pass error to error handler
  }
});

module.exports = router;
