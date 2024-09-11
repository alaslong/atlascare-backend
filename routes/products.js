const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase'); // Supabase client

// Add a new product to the products table
router.post('/products/add', async (req, res) => {
  const { productNumber, primaryName, secondaryName, image, noBarcode } = req.body;

  try {
    // Step 1: Check if the product already exists in the products table
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_number', productNumber)
      .single();

    if (existingProduct) {
      return res.status(400).json({ message: 'Product already exists', code: 'PRODUCT_EXISTS' });
    }

    // Step 2: Insert the new product into the products table
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert([
        {
          product_number: productNumber,
          primary_name: primaryName,
          secondary_name: secondaryName,
          image: image || null,
          no_barcode: noBarcode || false,
        },
      ])
      .single();

    if (insertError) {
      return res.status(500).json({ message: 'Error adding product', error: insertError.message });
    }

    return res.status(200).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Get a product by product number
router.get('/products/:productNumber', async (req, res) => {
  const { productNumber } = req.params;

  try {
    // Step 1: Fetch the product from the products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_number', productNumber)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found', error: productError });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Update a product by product number
router.put('/products/:productNumber', async (req, res) => {
  const { productNumber } = req.params;
  const { primaryName, secondaryName, image, noBarcode } = req.body;

  try {
    // Step 1: Check if the product exists
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_number', productNumber)
      .single();

    if (!existingProduct || productError) {
      return res.status(404).json({ message: 'Product not found', error: productError });
    }

    // Step 2: Update the product with new data
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        primary_name: primaryName || existingProduct.primary_name,
        secondary_name: secondaryName || existingProduct.secondary_name,
        image: image || existingProduct.image,
        no_barcode: noBarcode !== undefined ? noBarcode : existingProduct.no_barcode,
      })
      .eq('product_number', productNumber)
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Error updating product', error: updateError.message });
    }

    return res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Delete a product by product number
router.delete('/products/:productNumber', async (req, res) => {
  const { productNumber } = req.params;

  try {
    // Step 1: Delete the product from the products table
    const { data: deletedProduct, error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('product_number', productNumber)
      .single();

    if (deleteError || !deletedProduct) {
      return res.status(404).json({ message: 'Error deleting product', error: deleteError });
    }

    return res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
