-- 1. Retrieve all films with a rating of G or PG that are not currently rented 
-- (either returned or never borrowed)
SELECT DISTINCT 
    film.film_id, 
    film.title, 
    film.rating
FROM film
INNER JOIN inventory ON film.film_id = inventory.film_id
WHERE film.rating IN ('G', 'PG')
  AND inventory.inventory_id NOT IN (
      SELECT inventory_id 
      FROM rental 
      WHERE return_date IS NULL
  );

-- 2. Create a waiting list table for children's movies.
CREATE TABLE children_waiting_list (
    waiting_id SERIAL PRIMARY KEY,
    child_name VARCHAR(100) NOT NULL,
    film_id INT REFERENCES film(film_id) ON DELETE CASCADE,
    store_id INT REFERENCES store(store_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test insertion: Add dummy rows to the waiting list
INSERT INTO children_waiting_list (child_name, film_id, store_id)
VALUES 
    ('Tommy', (SELECT film_id FROM film WHERE rating IN ('G', 'PG') LIMIT 1), 1),
    ('Sarah', (SELECT film_id FROM film WHERE rating IN ('G', 'PG') LIMIT 1), 1),
    ('Leo', (SELECT film_id FROM film WHERE rating IN ('G', 'PG') OFFSET 1 LIMIT 1), 2);

-- 3. Retrieve the number of people waiting for each children's DVD
SELECT 
    film.film_id,
    film.title,
    film.rating,
    COUNT(children_waiting_list.waiting_id) AS total_waiting
FROM children_waiting_list
INNER JOIN film ON children_waiting_list.film_id = film.film_id
GROUP BY film.film_id, film.title, film.rating
ORDER BY total_waiting DESC;