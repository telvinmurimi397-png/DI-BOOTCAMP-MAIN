--Exercise 1: DVD Rental
-- 1. Get a list of all languages
SELECT * FROM language;

-- 2. Get films joined with their languages (title, description, language name)
SELECT 
    film.title, 
    film.description, 
    language.name AS language_name
FROM film
INNER JOIN language ON film.language_id = language.language_id;

-- 3. Get all languages, even if there are no films in those languages
SELECT 
    film.title, 
    film.description, 
    language.name AS language_name
FROM language
LEFT JOIN film ON language.language_id = film.language_id;

-- 4. Create new_film table and insert new films
CREATE TABLE new_film (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

INSERT INTO new_film (name) 
VALUES ('Inception'), ('Interstellar'), ('The Dark Knight');

-- 5. Create customer_review table with ON DELETE CASCADE
CREATE TABLE customer_review (
    review_id SERIAL PRIMARY KEY,
    film_id INT REFERENCES new_film(id) ON DELETE CASCADE,
    language_id INT REFERENCES language(language_id),
    title VARCHAR(255) NOT NULL,
    score INT CHECK (score BETWEEN 1 AND 10),
    review_text TEXT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add 2 movie reviews linked to valid objects
INSERT INTO customer_review (film_id, language_id, title, score, review_text)
VALUES 
(
    (SELECT id FROM new_film WHERE name = 'Inception'),
    (SELECT language_id FROM language WHERE name = 'English'),
    'Mind Bending!',
    9,
    'An incredible movie with fantastic visuals.'
),
(
    (SELECT id FROM new_film WHERE name = 'Interstellar'),
    (SELECT language_id FROM language WHERE name = 'English'),
    'Masterpiece',
    10,
    'Beautiful story and incredible soundtrack.'
);

-- 7. Delete a film that has a review from new_film
DELETE FROM new_film WHERE name = 'Inception';
-- Answer: Because of ON DELETE CASCADE on the film_id foreign key constraint, 
-- the associated review in customer_review is automatically deleted.


-- Exercise 2: DVD Rental
-- 1. Update the language of some films
UPDATE film
SET language_id = (SELECT language_id FROM language WHERE name = 'Italian')
WHERE film_id IN (1, 2, 3);

-- 2. Foreign keys on customer table:
-- Foreign keys defined: store_id (references store) and address_id (references address).
-- Effect on INSERT: Whenever you insert a new record into `customer`, 
-- the provided `store_id` and `address_id` MUST already exist in the `store` and `address` tables respectively.

-- 3. Drop customer_review table:
DROP TABLE customer_review;
-- Answer: Dropping this table is straightforward because `customer_review` is a child table 
-- (no other tables reference its primary key with a foreign key constraint).

-- 4. Outstanding rentals (return_date IS NULL)
SELECT COUNT(*) AS outstanding_rentals
FROM rental
WHERE return_date IS NULL;

-- 5. 30 most expensive outstanding movies (by replacement_cost or rental_rate)
SELECT DISTINCT
    film.film_id,
    film.title,
    film.replacement_cost,
    film.rental_rate
FROM rental
INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
INNER JOIN film ON inventory.film_id = film.film_id
WHERE rental.return_date IS NULL
ORDER BY film.replacement_cost DESC, film.rental_rate DESC
LIMIT 30;

-- 6. Finding the 4 films:

-- Film 1: Sumo wrestler + actor Penelope Monroe
SELECT film.title, film.description
FROM film
INNER JOIN film_actor ON film.film_id = film_actor.film_id
INNER JOIN actor ON film_actor.actor_id = actor.actor_id
WHERE actor.first_name = 'PENELOPE' 
  AND actor.last_name = 'MONROE'
  AND film.description ILIKE '%sumo wrestler%';

-- Film 2: Short documentary (< 60 mins), rated "R"
SELECT film.title, film.length, film.rating, category.name AS category
FROM film
INNER JOIN film_category ON film.film_id = film_category.film_id
INNER JOIN category ON film_category.category_id = category.category_id
WHERE category.name = 'Documentary'
  AND film.length < 60
  AND film.rating = 'R';

-- Film 3: Rented by Matthew Mahan, paid > $4.00, returned between July 28 & Aug 1, 2005
SELECT DISTINCT film.title
FROM rental
INNER JOIN customer ON rental.customer_id = customer.customer_id
INNER JOIN payment ON rental.rental_id = payment.rental_id
INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
INNER JOIN film ON inventory.film_id = film.film_id
WHERE customer.first_name = 'MATTHEW' 
  AND customer.last_name = 'MAHAN'
  AND payment.amount > 4.00
  AND rental.return_date BETWEEN '2005-07-28' AND '2005-08-01 23:59:59';

-- Film 4: Rented by Matthew Mahan, contains "boat" in title/description, high replacement cost
SELECT DISTINCT film.title, film.description, film.replacement_cost
FROM rental
INNER JOIN customer ON rental.customer_id = customer.customer_id
INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
INNER JOIN film ON inventory.film_id = film.film_id
WHERE customer.first_name = 'MATTHEW' 
  AND customer.last_name = 'MAHAN'
  AND (film.title ILIKE '%boat%' OR film.description ILIKE '%boat%')
ORDER BY film.replacement_cost DESC;