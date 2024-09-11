const express = require('express');
const router = express.Router();
const { createClient } = require('../lib/supabase'); // Assuming you have a supabase client
const logger = require('../middleware/logger'); // Winston logger

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
      return res.status(500).json({ message: 'Error fetching product stock' });
    }

    return res.status(200).json({ inventory: data });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a product to client's inventory or update quantity if product and batch match
router.post('/inventory/add', async (req, res) => {
  const { client_practice_id, batch_number, expiry_date, product_number, quantity = 1 } = req.body;

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Step 1: Check if the product exists in the products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_number', product_number)
      .single();

    if (productError || !product) {
      return res.status(400).json({ message: 'Product does not exist' });
    }

    // Step 2: Check if the product with the same batch number exists in the client's inventory
    const { data: existingInventory, error: inventoryError } = await supabase
      .from('client_inventory_stocks')
      .select('*')
      .eq('client_practice_id', client_practice_id)
      .eq('product_id', product.id)
      .eq('batch_number', batch_number)
      .single();

    if (inventoryError && inventoryError.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Error checking inventory' });
    }

    // Step 3: Add or update inventory
    if (existingInventory) {
      const updatedQuantity = existingInventory.quantity + quantity;
      const { error: updateError } = await supabase
        .from('client_inventory_stocks')
        .update({
          quantity: updatedQuantity,
          batch_number,
          expiry_date,
        })
        .eq('id', existingInventory.id);

      if (updateError) {
        return res.status(500).json({ message: 'Error updating inventory' });
      }
      return res.status(200).json({ message: 'Inventory updated successfully' });
    } else {
      const { error: insertError } = await supabase
        .from('client_inventory_stocks')
        .insert([{
          client_practice_id,
          product_id: product.id,
          batch_number,
          expiry_date,
          quantity
        }]);

      if (insertError) {
        return res.status(500).json({ message: 'Error adding to inventory' });
      }

      return res.status(200).json({ message: 'Product added to inventory successfully' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Reduce product quantity from client's inventory
router.post('/inventory/remove', async (req, res) => {
  const { client_practice_id, batch_number, product_number, quantity = 1 } = req.body;

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Step 1: Check if the product exists in the products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_number', product_number)
      .single();

    if (productError || !product) {
      return res.status(400).json({ message: 'Product does not exist' });
    }

    // Step 2: Check if the product with the same batch number exists in the client's inventory
    const { data: existingInventory, error: inventoryError } = await supabase
      .from('client_inventory_stocks')
      .select('*')
      .eq('client_practice_id', client_practice_id)
      .eq('product_id', product.id)
      .eq('batch_number', batch_number)
      .single();

    if (!existingInventory || inventoryError) {
      return res.status(400).json({ message: 'Product not found in inventory' });
    }

    // Step 3: Reduce quantity or delete record if quantity becomes zero
    const updatedQuantity = existingInventory.quantity - quantity;

    if (updatedQuantity <= 0) {
      const { error: deleteError } = await supabase
        .from('client_inventory_stocks')
        .delete()
        .eq('id', existingInventory.id);

      if (deleteError) {
        return res.status(500).json({ message: 'Error deleting inventory' });
      }

      return res.status(200).json({ message: 'Product removed from inventory' });
    } else {
      const { error: updateError } = await supabase
        .from('client_inventory_stocks')
        .update({ quantity: updatedQuantity })
        .eq('id', existingInventory.id);

      if (updateError) {
        return res.status(500).json({ message: 'Error updating inventory' });
      }

      return res.status(200).json({ message: 'Inventory quantity reduced successfully' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
