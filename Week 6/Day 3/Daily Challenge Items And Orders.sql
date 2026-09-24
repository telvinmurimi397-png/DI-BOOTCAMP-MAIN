-- 1. Create Tables with One-to-Many Relationships
-- Create Users table (Bonus)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Create Product Orders table (One user can have many orders)
CREATE TABLE product_orders (
    order_id SERIAL PRIMARY KEY,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create Items table (One order can have many items)
CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    order_id INT REFERENCES product_orders(order_id) ON DELETE CASCADE
)


-- 2. Insert Sample Data for Testing

INSERT INTO users (username, email) VALUES
('alice_w', 'alice@example.com'),
('bob_m', 'bob@example.com');

INSERT INTO product_orders (user_id) VALUES
(1), -- Order 1 by Alice
(1), -- Order 2 by Alice
(2); -- Order 3 by Bob

INSERT INTO items (item_name, price, order_id) VALUES
('Laptop Stand', 29.99, 1),
('Wireless Mouse', 15.50, 1),
('USB-C Cable', 9.99, 1),
('Mechanical Keyboard', 85.00, 2),
('Monitor', 199.99, 3);


-- 3. Function: Total Price for a Given Order

CREATE OR REPLACE FUNCTION get_order_total(p_order_id INT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    total_price DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(price), 0.00)
    INTO total_price
    FROM items
    WHERE order_id = p_order_id;

    RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- Test the order total function (e.g., Order ID 1)
SELECT get_order_total(1) AS order_1_total;


-- 4. Bonus Function: Total Price for a Given Order of a Given User

CREATE OR REPLACE FUNCTION get_user_order_total(p_user_id INT, p_order_id INT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    total_price DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(i.price), 0.00)
    INTO total_price
    FROM items i
    JOIN product_orders o ON i.order_id = o.order_id
    WHERE o.user_id = p_user_id AND o.order_id = p_order_id;

    RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- Test the user order total function (User ID 1, Order ID 1)
SELECT get_user_order_total(1, 1) AS user_1_order_1_total;