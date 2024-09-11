const { convertToCamelCase, convertToSnakeCase } = require('../lib/caseConverters');

// Middleware to convert response data to camelCase
const convertResponseToCamelCase = (data) => {
    if (Array.isArray(data)) {
      return data.map(item => convertToCamelCase(item));
    } else if (data !== null && typeof data === 'object') {
      return convertToCamelCase(data);
    }
    return data; // Return data as is if it's not an object or array
  };

// Middleware to convert request data to snake_case
const convertRequestToSnakeCase = (req, res, next) => {
  // Convert the body
  if (req.body) {
   
    req.body = convertToSnakeCase(req.body);
    
  }

  // Convert query parameters
  if (req.query) {
   
    req.query = convertToSnakeCase(req.query);
    
  }

  next();
};

module.exports = {
  convertResponseToCamelCase,
  convertRequestToSnakeCase,
};
