--Exercise 1: DVD Rentals
-- 1. Get a list of all rentals which are out (have not been returned).
-- How we identify them: In the `rental` table, returned films have a `return_date`, 
-- so unreturned films have `return_date IS NULL`.
SELECT rental.*, film.title
FROM rental
INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
INNER JOIN film ON inventory.film_id = film.film_id
WHERE rental.return_date IS NULL;


-- 2. Get a list of all customers who have not returned their rentals (grouped).
SELECT 
    customer.customer_id, 
    customer.first_name, 
    customer.last_name, 
    COUNT(rental.rental_id) AS unreturned_count
FROM customer
INNER JOIN rental ON customer.customer_id = rental.customer_id
WHERE rental.return_date IS NULL
GROUP BY customer.customer_id, customer.first_name, customer.last_name;


-- 3. Get a list of all Action films with Joe Swank.
-- Shortcut: You can use existing pre-built views like `actor_info` or `film_list` if available, 
-- or create/query via joins:
SELECT film.film_id, film.title, category.name AS category_name
FROM film
INNER JOIN film_actor ON film.film_id = film_actor.film_id
INNER JOIN actor ON film_actor.actor_id = actor.actor_id
INNER JOIN film_category ON film.film_id = film_category.film_id
INNER JOIN category ON film_category.category_id = category.category_id
WHERE actor.first_name = 'JOE' 
  AND actor.last_name = 'SWANK'
  AND category.name = 'Action';


--Exercise 2: Happy Halloween
-- 1. How many stores there are, and in which city and country they are located.
SELECT 
    store.store_id, 
    city.city, 
    country.country
FROM store
INNER JOIN address ON store.address_id = address.address_id
INNER JOIN city ON address.city_id = city.city_id
INNER JOIN country ON city.country_id = country.country_id;


-- 2 & 3. Total viewing time in hours in each store for available (returned) inventory items.
-- Excludes items currently out on rental (where return_date IS NULL).
SELECT 
    inventory.store_id,
    SUM(film.length) AS total_minutes,
    ROUND(SUM(film.length) / 60.0, 2) AS total_hours,
    ROUND(SUM(film.length) / 1440.0, 2) AS total_days
FROM inventory
INNER JOIN film ON inventory.film_id = film.film_id
WHERE inventory.inventory_id NOT IN (
    SELECT inventory_id 
    FROM rental 
    WHERE return_date IS NULL
)
GROUP BY inventory.store_id;


-- 4. A list of all customers in the cities where stores are located.
SELECT DISTINCT customer.customer_id, customer.first_name, customer.last_name, city.city
FROM customer
INNER JOIN address ON customer.address_id = address.address_id
INNER JOIN city ON address.city_id = city.city_id
WHERE city.city_id IN (
    SELECT store_address.city_id
    FROM store
    INNER JOIN address AS store_address ON store.address_id = store_address.address_id
);


-- 5. A list of all customers in the countries where stores are located.
SELECT DISTINCT customer.customer_id, customer.first_name, customer.last_name, country.country
FROM customer
INNER JOIN address ON customer.address_id = address.address_id
INNER JOIN city ON address.city_id = city.city_id
INNER JOIN country ON city.country_id = country.country_id
WHERE country.country_id IN (
    SELECT store_city.country_id
    FROM store
    INNER JOIN address AS store_address ON store.address_id = store_address.address_id
    INNER JOIN city AS store_city ON store_address.city_id = store_city.city_id
);


-- 6 & 7. Safe list (no 'Horror' or scary keywords in title/description) + viewing times in minutes, hours, and days.
-- Using a temporary table with a CHECK constraint as hinted:
CREATE TEMPORARY TABLE safe_movies (
    film_id INT PRIMARY KEY,
    title VARCHAR(255),
    length INT,
    CONSTRAINT check_safe_movie CHECK (
        title NOT ILIKE '%beast%' AND title NOT ILIKE '%monster%' AND 
        title NOT ILIKE '%ghost%' AND title NOT ILIKE '%dead%' AND 
        title NOT ILIKE '%zombie%' AND title NOT ILIKE '%undead%'
    )
);

-- Insert eligible films excluding Horror category and keywords
INSERT INTO safe_movies (film_id, title, length)
SELECT film.film_id, film.title, film.length
FROM film
INNER JOIN film_category ON film.film_id = film_category.film_id
INNER JOIN category ON film_category.category_id = category.category_id
WHERE category.name <> 'Horror'
  AND film.title NOT ILIKE '%beast%' AND film.description NOT ILIKE '%beast%'
  AND film.title NOT ILIKE '%monster%' AND film.description NOT ILIKE '%monster%'
  AND film.title NOT ILIKE '%ghost%' AND film.description NOT ILIKE '%ghost%'
  AND film.title NOT ILIKE '%dead%' AND film.description NOT ILIKE '%dead%'
  AND film.title NOT ILIKE '%zombie%' AND film.description NOT ILIKE '%zombie%'
  AND film.title NOT ILIKE '%undead%' AND film.description NOT ILIKE '%undead%';

-- Query total safe list viewing time (General vs Safe comparison)
SELECT 
    'General List' AS movie_list_type,
    SUM(length) AS total_minutes,
    ROUND(SUM(length) / 60.0, 2) AS total_hours,
    ROUND(SUM(length) / 1440.0, 2) AS total_days
FROM film
UNION ALL
SELECT 
    'Safe List' AS movie_list_type,
    SUM(length) AS total_minutes,
    ROUND(SUM(length) / 60.0, 2) AS total_hours,
    ROUND(SUM(length) / 1440.0, 2) AS total_days
FROM safe_movies;