--Exercise 1: DVD Rental
-- 1. Find out how many films there are for each rating
SELECT rating, COUNT(*) AS film_count
FROM film
GROUP BY rating;

-- 2. Get a list of movies rated G or PG-13, under 2 hours (120 mins), 
-- rental_rate < 3.00, sorted alphabetically
SELECT title, rating, length, rental_rate
FROM film
WHERE rating IN ('G', 'PG-13')
  AND length < 120
  AND rental_rate < 3.00
ORDER BY title ASC;

-- 3. Find a customer and change details to yours using UPDATE
UPDATE customer
SET first_name = 'YourFirstName',
    last_name = 'YourLastName',
    email = 'your.email@example.com'
WHERE customer_id = 1;

-- 4. Find the customer's address and update it
UPDATE address
SET address = '123 Main Street',
    district = 'Some District',
    postal_code = '12345'
WHERE address_id = (
    SELECT address_id 
    FROM customer 
    WHERE customer_id = 1
);


--Exercise 2: students Table
-- Update birth dates for Lea and Marc Benichou
UPDATE students
SET birth_date = '1998-11-02'
WHERE (first_name = 'Lea' AND last_name = 'Benichou')
   OR (first_name = 'Marc' AND last_name = 'Benichou');

-- Change last_name of David from 'Grez' to 'Guez'
UPDATE students
SET last_name = 'Guez'
WHERE first_name = 'David' AND last_name = 'Grez';


-- DELETE
-- Delete student named Lea Benichou
DELETE FROM students
WHERE first_name = 'Lea' AND last_name = 'Benichou';


-- COUNT
-- Count total students
SELECT COUNT(*) FROM students;

-- Count students born after 1/01/2000
SELECT COUNT(*) FROM students
WHERE birth_date > '2000-01-01';


-- INSERT / ALTER
-- Add math_grade column
ALTER TABLE students
ADD COLUMN math_grade INT;

-- Add grades for specific IDs
UPDATE students SET math_grade = 80 WHERE id = 1;
UPDATE students SET math_grade = 90 WHERE id IN (2, 4);
UPDATE students SET math_grade = 40 WHERE id = 6;

-- Count students with grade > 83
SELECT COUNT(*) FROM students
WHERE math_grade > 83;

-- Add another 'Omer Simpson' with the same birth_date as existing Omer Simpson and grade 70
INSERT INTO students (first_name, last_name, birth_date, math_grade)
VALUES (
    'Omer', 
    'Simpson', 
    (SELECT birth_date FROM students WHERE first_name = 'Omer' AND last_name = 'Simpson' LIMIT 1), 
    70
);

-- Bonus: Count how many grades each student has
SELECT first_name, last_name, COUNT(math_grade) AS total_grade
FROM students
GROUP BY first_name, last_name;


-- SUM
-- Find the sum of all student grades
SELECT SUM(math_grade) AS sum_grades
FROM students;


--Exercise 3: Items and Customers
-- 1. Create purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    item_id INT REFERENCES items(id),
    quantity_purchased INT
);

-- 2. Insert purchases using subqueries
-- Scott Scott bought 1 fan
INSERT INTO purchases (customer_id, item_id, quantity_purchased)
VALUES (
    (SELECT id FROM customers WHERE first_name = 'Scott' AND last_name = 'Scott'),
    (SELECT id FROM items WHERE item_name = 'Fan'),
    1
);

-- Melanie Johnson bought 10 large desks
INSERT INTO purchases (customer_id, item_id, quantity_purchased)
VALUES (
    (SELECT id FROM customers WHERE first_name = 'Melanie' AND last_name = 'Johnson'),
    (SELECT id FROM items WHERE item_name = 'Large Desk'),
    10
);

-- Greg Jones bought 2 small desks
INSERT INTO purchases (customer_id, item_id, quantity_purchased)
VALUES (
    (SELECT id FROM customers WHERE first_name = 'Greg' AND last_name = 'Jones'),
    (SELECT id FROM items WHERE item_name = 'Small Desk'),
    2
);


--Part II
-- 1.1 All purchases
SELECT * FROM purchases;
-- Utility answer: On its own, raw foreign key IDs (customer_id, item_id) aren't very useful to users 
-- because they don't display human-readable information like customer names or item details.

-- 1.2 All purchases joined with customers table
SELECT purchases.*, customers.first_name, customers.last_name
FROM purchases
INNER JOIN customers ON purchases.customer_id = customers.id;

-- 1.3 Purchases of customer ID = 5
SELECT * FROM purchases
WHERE customer_id = 5;

-- 1.4 Purchases for Large Desk AND Small Desk
SELECT purchases.*, items.item_name
FROM purchases
INNER JOIN items ON purchases.item_id = items.id
WHERE items.item_name IN ('Large Desk', 'Small Desk');

-- 2. Customers who made a purchase (First Name, Last Name, Item Name)
SELECT customers.first_name, customers.last_name, items.item_name
FROM purchases
INNER JOIN customers ON purchases.customer_id = customers.id
INNER JOIN items ON purchases.item_id = items.id;

-- 3. Add a row referencing customer by ID but leaving item_id blank/NULL
INSERT INTO purchases (customer_id, item_id, quantity_purchased)
VALUES (1, NULL, 1);