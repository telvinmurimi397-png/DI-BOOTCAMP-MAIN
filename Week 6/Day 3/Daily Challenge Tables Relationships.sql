--Part I: One-to-One Relationship
-- 1. Create tables
CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE customer_profile (
    id SERIAL PRIMARY KEY,
    isLoggedIn BOOLEAN DEFAULT false,
    customer_id INT UNIQUE REFERENCES customer(id) ON DELETE CASCADE
);

-- 2. Insert customers
INSERT INTO customer (first_name, last_name)
VALUES 
    ('John', 'Doe'),
    ('Jerome', 'Lalu'),
    ('Lea', 'Rive');

-- 3. Insert customer profiles using subqueries
-- John is loggedIn
INSERT INTO customer_profile (isLoggedIn, customer_id)
VALUES (
    true, 
    (SELECT id FROM customer WHERE first_name = 'John' AND last_name = 'Doe')
);

-- Jerome is not logged in
INSERT INTO customer_profile (isLoggedIn, customer_id)
VALUES (
    false, 
    (SELECT id FROM customer WHERE first_name = 'Jerome' AND last_name = 'Lalu')
);

-- 4. Queries using Joins

-- Query 1: The first_name of the LoggedIn customers
SELECT customer.first_name
FROM customer
INNER JOIN customer_profile ON customer.id = customer_profile.customer_id
WHERE customer_profile.isLoggedIn = true;

-- Query 2: All customers' first_name and isLoggedIn status (including those without a profile)
SELECT customer.first_name, customer_profile.isLoggedIn
FROM customer
LEFT JOIN customer_profile ON customer.id = customer_profile.customer_id;

-- Query 3: The number of customers that are NOT LoggedIn 
-- (Includes customers with isLoggedIn = false OR customers with no profile record / NULL)
SELECT COUNT(*) AS not_loggedin_count
FROM customer
LEFT JOIN customer_profile ON customer.id = customer_profile.customer_id
WHERE customer_profile.isLoggedIn = false 
   OR customer_profile.isLoggedIn IS NULL;

   
--Part II: Many-to-Many Relationship
-- 1. Create Book table
CREATE TABLE book (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL
);

-- 2. Insert books
INSERT INTO book (title, author)
VALUES 
    ('Alice In Wonderland', 'Lewis Carroll'),
    ('Harry Potter', 'J.K Rowling'),
    ('To kill a mockingbird', 'Harper Lee');

-- 3. Create Student table with CHECK constraint for age
CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    age INT CHECK (age <= 15)
);

-- 4. Insert students
INSERT INTO student (name, age)
VALUES 
    ('John', 12),
    ('Lera', 11),
    ('Patrick', 10),
    ('Bob', 14);

-- 5. Create Library junction table
CREATE TABLE library (
    book_fk_id INT REFERENCES book(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_fk_id INT REFERENCES student(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    borrowed_date DATE,
    PRIMARY KEY (book_fk_id, student_fk_id, borrowed_date)
);

-- 6. Insert 4 records into junction table using subqueries
-- John borrowed Alice In Wonderland on 15/02/2022
INSERT INTO library (student_fk_id, book_fk_id, borrowed_date)
VALUES (
    (SELECT student_id FROM student WHERE name = 'John'),
    (SELECT book_id FROM book WHERE title = 'Alice In Wonderland'),
    '2022-02-15'
);

-- Bob borrowed To kill a mockingbird on 03/03/2021
INSERT INTO library (student_fk_id, book_fk_id, borrowed_date)
VALUES (
    (SELECT student_id FROM student WHERE name = 'Bob'),
    (SELECT book_id FROM book WHERE title = 'To kill a mockingbird'),
    '2021-03-03'
);

-- Lera borrowed Alice In Wonderland on 23/05/2021
INSERT INTO library (student_fk_id, book_fk_id, borrowed_date)
VALUES (
    (SELECT student_id FROM student WHERE name = 'Lera'),
    (SELECT book_id FROM book WHERE title = 'Alice In Wonderland'),
    '2021-05-23'
);

-- Bob borrowed Harry Potter on 12/08/2021
INSERT INTO library (student_fk_id, book_fk_id, borrowed_date)
VALUES (
    (SELECT student_id FROM student WHERE name = 'Bob'),
    (SELECT book_id FROM book WHERE title = 'Harry Potter'),
    '2021-08-12'
);

-- 7. Display the data

-- Display 1: Select all columns from the junction table
SELECT * FROM library;

-- Display 2: Select student name and borrowed book title
SELECT student.name, book.title, library.borrowed_date
FROM library
INNER JOIN student ON library.student_fk_id = student.student_id
INNER JOIN book ON library.book_fk_id = book.book_id;

-- Display 3: Select the average age of children who borrowed 'Alice In Wonderland'
SELECT ROUND(AVG(student.age), 2) AS avg_age
FROM library
INNER JOIN student ON library.student_fk_id = student.student_id
INNER JOIN book ON library.book_fk_id = book.book_id
WHERE book.title = 'Alice In Wonderland';

-- Delete a student from the Student table
DELETE FROM student WHERE name = 'Patrick'; 
-- Or delete a student who has borrowed books:
DELETE FROM student WHERE name = 'John';