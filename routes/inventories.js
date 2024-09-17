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
      return res.status(500).json({ message: 'Error fetching product stock' });
    }

    return res.status(200).json({ inventory: data });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add multiple products to client's inventory or update quantity if product and batch match
router.post('/inventory/add', async (req, res) => {
  const { client_practice_id, products } = req.body; // `products` is an array of product objects

  if (!client_practice_id || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'client_practice_id and products array are required' });
  }

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Loop through each product in the array
    for (const product of products) {
      const { product_number, batch_number, expiry_date, quantity = 1 } = product;

      // Step 1: Check if the product exists in the products table
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('product_number', product_number)
        .single();

      if (productError || !productData) {
        console.error(`Product with number ${product_number} does not exist.`);
        continue; // Skip this product and continue to the next
      }

      const productId = productData.id;

      // Step 2: Check if the product with the same batch number exists in the client's inventory
      const { data: existingInventory, error: inventoryError } = await supabase
        .from('client_inventory_stocks')
        .select('*')
        .eq('client_practice_id', client_practice_id)
        .eq('product_id', productId)
        .eq('batch_number', batch_number)
        .single();

      if (inventoryError && inventoryError.code !== 'PGRST116') {
        console.error(`Error checking inventory for product ${product_number} and batch ${batch_number}.`);
        continue; // Skip to the next product in case of an error
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
          console.error(`Error updating inventory for product ${product_number} and batch ${batch_number}.`);
          continue; // Skip this product and continue
        }
      } else {
        // Insert new inventory record if it doesn't exist
        const { error: insertError } = await supabase
          .from('client_inventory_stocks')
          .insert([{
            client_practice_id,
            product_id: productId,
            batch_number,
            expiry_date,
            quantity,
          }]);

        if (insertError) {
          console.error(`Error adding to inventory for product ${product_number} and batch ${batch_number}.`);
          continue; // Skip this product and continue
        }
      }
    }

    return res.status(200).json({ message: 'Products processed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Remove multiple products from client's inventory
router.post('/inventory/remove', async (req, res) => {
  const { client_practice_id, products } = req.body; // `products` is an array of product objects

  if (!client_practice_id || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'client_practice_id and products array are required' });
  }

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Loop through each product in the array
    for (const product of products) {
      const { product_number, batch_number, quantity = 1 } = product;

      // Step 1: Check if the product exists in the products table
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('product_number', product_number)
        .single();

      if (productError || !productData) {
        console.error(`Product with number ${product_number} does not exist.`);
        continue; // Skip this product and continue to the next
      }

      const productId = productData.id;

      // Step 2: Check if the product with the same batch number exists in the client's inventory
      const { data: existingInventory, error: inventoryError } = await supabase
        .from('client_inventory_stocks')
        .select('*')
        .eq('client_practice_id', client_practice_id)
        .eq('product_id', productId)
        .eq('batch_number', batch_number)
        .single();

      if (!existingInventory || inventoryError) {
        console.error(`Product ${product_number} with batch ${batch_number} not found in inventory.`);
        continue; // Skip this product if it's not found in the inventory
      }

      // Step 3: Reduce quantity or delete record if quantity becomes zero or negative
      const updatedQuantity = existingInventory.quantity - quantity;

      if (updatedQuantity <= 0) {
        const { error: deleteError } = await supabase
          .from('client_inventory_stocks')
          .delete()
          .eq('id', existingInventory.id);

        if (deleteError) {
          console.error(`Error deleting inventory for product ${product_number} and batch ${batch_number}.`);
          continue; // Skip this product in case of an error
        }
      } else {
        const { error: updateError } = await supabase
          .from('client_inventory_stocks')
          .update({ quantity: updatedQuantity })
          .eq('id', existingInventory.id);

        if (updateError) {
          console.error(`Error updating inventory for product ${product_number} and batch ${batch_number}.`);
          continue; // Skip this product in case of an error
        }
      }
    }

    return res.status(200).json({ message: 'Products processed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Route to get specific product stock for a client by client_id, product_number, and batch_number
router.get('/inventory/product', async (req, res) => {
  const { client_practice_id, product_number, batch_number } = req.query; // Get query parameters

  // Validate query parameters
  if (!client_practice_id || !product_number || !batch_number) {
    return res.status(400).json({ message: 'client_practice_id, product_number, and batch_number are required' });
  }

  try {
    const supabase = createClient(); // Initialize Supabase client

    // Step 1: Fetch the product using the product_number
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id') // Only need the product ID to join with the view
      .eq('product_number', product_number)
      .single();

    if (productError || !product) {
      return res.status(400).json({ message: 'Product not found' });
    }

    // Step 2: Fetch the entry from the view based on client_id, product_id, and batch_number
    const { data: stockData, error: stockError } = await supabase
      .from('client_practice_product_stock') // Using the view
      .select('*') // Select all the relevant fields
      .eq('client_practice_id', client_practice_id)
      .eq('product_id', product.id)
      .eq('batch_number', batch_number) // Filter by batch number
      .single(); // Expect only one result

    if (stockError || !stockData) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    // Step 3: Return the stock information
    return res.status(200).json({ stock: stockData });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
