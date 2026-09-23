--Exercise 1: Items and Customers Database
-- 1. All items, ordered by price (lowest to highest)
SELECT * 
FROM items 
ORDER BY price ASC;

-- 2. Items with a price above 80 (80 included), ordered by price (highest to lowest)
SELECT * 
FROM items 
WHERE price >= 80 
ORDER BY price DESC;

-- 3. The first 3 customers in alphabetical order of the first name (A-Z) – excluding the primary key column (id)
SELECT first_name, last_name 
FROM customers 
ORDER BY first_name ASC 
LIMIT 3;

-- 4. All last names (no other columns!), in reverse alphabetical order (Z-A)
SELECT last_name 
FROM customers 
ORDER BY last_name DESC;


--Exercise 2: DVD Rental Database
-- 1. Select all columns from the customer table
SELECT * 
FROM customer;

-- 2. Display names (first_name, last_name) using an alias named "full_name"
SELECT first_name || ' ' || last_name AS full_name 
FROM customer;

-- 3. Select all unique create_date values from the customer table
SELECT DISTINCT create_date 
FROM customer;

-- 4. Get all customer details, displayed in descending order by first name
SELECT * 
FROM customer 
ORDER BY first_name DESC;

-- 5. Get film ID, title, description, release year, and rental rate in ascending order by rental rate
SELECT film_id, title, description, release_year, rental_rate 
FROM film 
ORDER BY rental_rate ASC;

-- 6. Get address and phone number for customers living in the 'Texas' district
SELECT address, phone 
FROM address 
WHERE district = 'Texas';

-- 7. Retrieve movie details where film_id is either 15 or 150
SELECT * 
FROM film 
WHERE film_id IN (15, 150);

-- 8. Check if your favorite movie exists in the database (e.g., 'Academy Dinosaur')
SELECT film_id, title, description, length, rental_rate 
FROM film 
WHERE title = 'Academy Dinosaur';

-- 9. Get details of movies starting with the first 2 letters of your favorite movie (e.g., 'Ac%')
SELECT film_id, title, description, length, rental_rate 
FROM film 
WHERE title ILIKE 'Ac%';

-- 10. Find the 10 cheapest movies
SELECT * 
FROM film 
ORDER BY rental_rate ASC 
LIMIT 10;

-- 11. Find the next 10 cheapest movies (using OFFSET)
SELECT * 
FROM film 
ORDER BY rental_rate ASC 
LIMIT 10 OFFSET 10;

-- 11 Bonus: Without using LIMIT (Standard SQL Syntax)
SELECT * 
FROM film 
ORDER BY rental_rate ASC 
OFFSET 10 ROWS 
FETCH FIRST 10 ROWS ONLY;

-- 12. Join customer and payment tables: first name, last name, amount, payment date ordered by customer_id
SELECT c.first_name, c.last_name, p.amount, p.payment_date 
FROM customer c
JOIN payment p ON c.customer_id = p.customer_id
ORDER BY c.customer_id ASC;

-- 13. Get all movies which are NOT in inventory
SELECT * 
FROM film 
WHERE film_id NOT IN (
    SELECT DISTINCT film_id 
    FROM inventory
);

-- 14. Find which city is in which country
SELECT city.city, country.country 
FROM city
JOIN country ON city.country_id = country.country_id;

-- 15. Bonus: Customer ID, names, amount, and payment date ordered by staff_id
SELECT p.customer_id, c.first_name, c.last_name, p.amount, p.payment_date, p.staff_id 
FROM payment p
JOIN customer c ON p.customer_id = c.customer_id
ORDER BY p.staff_id ASC;