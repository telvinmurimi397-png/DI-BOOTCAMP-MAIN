-- 1. Fetch the last 2 customers in alphabetical order (A-Z) - exclude 'id' from results
SELECT first_name, last_name
FROM customers
ORDER BY last_name DESC, first_name DESC
LIMIT 2;

-- 2. Use SQL to delete all purchases made by Scott
DELETE FROM purchases
WHERE customer_id = (
    SELECT id 
    FROM customers 
    WHERE first_name = 'Scott' AND last_name = 'Scott'
);

-- 3. Does Scott still exist in the customers table, even though his purchases were deleted?
-- Run this query to check if Scott is still in the customers table:
SELECT * 
FROM customers 
WHERE first_name = 'Scott' AND last_name = 'Scott';


SELECT 
    purchases.id,
    purchases.item_id,
    purchases.quantity_purchased,
    COALESCE(customers.first_name, '') AS first_name,
    COALESCE(customers.last_name, '') AS last_name
FROM purchases
LEFT JOIN customers ON purchases.customer_id = customers.id;


-- 5. Find all purchases joining with customers so Scott's purchase (or non-matching orders) will NOT appear
-- (Use an INNER JOIN)
SELECT 
    purchases.id,
    purchases.item_id,
    purchases.quantity_purchased,
    customers.first_name,
    customers.last_name
FROM purchases
INNER JOIN customers ON purchases.customer_id = customers.id;
   