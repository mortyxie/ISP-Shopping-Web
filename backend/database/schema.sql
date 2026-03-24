PRAGMA foreign_keys = OFF;

-- Drop all existing tables and views
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Cart_Items;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Albums;
DROP TABLE IF EXISTS Shipping_Address;
DROP TABLE IF EXISTS Discussion_Bubbles;
DROP TABLE IF EXISTS Users;

-- Drop all existing triggers
DROP TRIGGER IF EXISTS ensure_single_default_address;
DROP TRIGGER IF EXISTS ensure_single_default_address_update;
DROP TRIGGER IF EXISTS update_order_total_after_insert;
DROP TRIGGER IF EXISTS update_order_total_after_update;
DROP TRIGGER IF EXISTS update_order_total_after_delete;
DROP TRIGGER IF EXISTS validate_order_paid;
DROP TRIGGER IF EXISTS validate_order_shipped;
DROP TRIGGER IF EXISTS validate_order_completed;
DROP TRIGGER IF EXISTS validate_order_cancelled;
DROP TRIGGER IF EXISTS prevent_inactive_cart_items;
DROP TRIGGER IF EXISTS cleanup_cart_after_order;

-- Drop all existing views
DROP VIEW IF EXISTS vw_product_details;
DROP VIEW IF EXISTS vw_order_summary;
DROP VIEW IF EXISTS vw_cart_details;
DROP VIEW IF EXISTS vw_user_discussions;

PRAGMA foreign_keys = ON;

-- Table: Users
-- Description: Stores all system user information
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('customer', 'admin'))
);

-- Table: Albums (Parent Table - SPU)
-- Description: Stores static, general information about music albums
CREATE TABLE Albums (
    album_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(100) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    cover_image_url VARCHAR(255) NOT NULL,
    genre VARCHAR(50),
    tracklist TEXT,
    release_year INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (release_year >= 1800 AND release_year <= 3000)
);

-- Table: Products (Child Table - SKU)
-- Description: Stores specific inventory items with condition and price
CREATE TABLE Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    condition VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_urls JSON,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES Albums(album_id) ON DELETE RESTRICT,
    CHECK (condition IN ('Mint', 'Near Mint', 'Good'))
);

-- Create indexes for faster product lookups by album
CREATE INDEX idx_products_album ON Products(album_id);
CREATE INDEX idx_products_active ON Products(is_active);

-- Table: Cart_Items
-- Description: Temporary storage for items in shopping cart
CREATE TABLE Cart_Items (
    cart_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

-- Create indexes for cart queries
CREATE INDEX idx_cart_user ON Cart_Items(user_id);
CREATE INDEX idx_cart_product ON Cart_Items(product_id);

-- Table: Orders (Order Header)
-- Description: Represents the transaction receipt
CREATE TABLE Orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    paid_at DATETIME,
    shipped_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled'))
);

-- Create indexes for order queries
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_orders_status ON Orders(status);
CREATE INDEX idx_orders_created ON Orders(created_at);

-- Table: Order_Items (Order Details)
-- Description: Links Orders to specific Products with historical price
CREATE TABLE Order_Items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE RESTRICT
);

-- Create indexes for order items
CREATE INDEX idx_order_items_order ON Order_Items(order_id);
CREATE INDEX idx_order_items_product ON Order_Items(product_id);

-- Table: Shipping_Address
-- Description: Stores user shipping addresses
CREATE TABLE Shipping_Address (
    address_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CHECK (is_default IN (0, 1))
);

-- Create index for faster lookups
CREATE INDEX idx_shipping_address_user ON Shipping_Address(user_id);
CREATE INDEX idx_shipping_address_default ON Shipping_Address(is_default);

-- Trigger to ensure only one default address per user
CREATE TRIGGER ensure_single_default_address
BEFORE INSERT ON Shipping_Address
BEGIN
    UPDATE Shipping_Address 
    SET is_default = 0 
    WHERE user_id = NEW.user_id AND NEW.is_default = 1;
END;

CREATE TRIGGER ensure_single_default_address_update
BEFORE UPDATE OF is_default ON Shipping_Address
WHEN NEW.is_default = 1 AND OLD.is_default = 0
BEGIN
    UPDATE Shipping_Address 
    SET is_default = 0 
    WHERE user_id = NEW.user_id AND address_id != NEW.address_id;
END;

-- Create new Reviews table
CREATE TABLE Reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_reviews_product ON Reviews(product_id);
CREATE INDEX idx_reviews_user ON Reviews(user_id);
CREATE INDEX idx_reviews_order ON Reviews(order_id);

-- Table: Review_Replies (for replies to reviews - no edit/delete)
CREATE TABLE Review_Replies (
    reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_reply_id INTEGER,  -- NULL for top-level, for nested replies
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES Reviews(review_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_reply_id) REFERENCES Review_Replies(reply_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_review_replies_review ON Review_Replies(review_id);
CREATE INDEX idx_review_replies_user ON Review_Replies(user_id);
CREATE INDEX idx_review_replies_parent ON Review_Replies(parent_reply_id);

-- Table: Discussion_Bubbles
-- Description: Forum/Message board for floating bubbles on frontend
CREATE TABLE Discussion_Bubbles (
    bubble_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create index for discussion bubbles
CREATE INDEX idx_discussion_user ON Discussion_Bubbles(user_id);
CREATE INDEX idx_discussion_created ON Discussion_Bubbles(created_at);

-- View: Product details with album information
CREATE VIEW vw_product_details AS
SELECT 
    p.product_id,
    p.condition,
    p.price,
    p.description,
    p.image_urls,
    p.is_active,
    a.album_id,
    a.title AS album_title,
    a.artist,
    a.cover_image_url,
    a.genre,
    a.release_year
FROM Products p
JOIN Albums a ON p.album_id = a.album_id;

-- View: Order summary with user information
CREATE VIEW vw_order_summary AS
SELECT 
    o.order_id,
    o.total_amount,
    o.status,
    o.paid_at,
    o.shipped_at,
    o.completed_at,
    o.cancelled_at,
    o.created_at,
    u.user_id,
    u.username,
    u.email,
    COUNT(oi.order_item_id) AS total_items
FROM Orders o
JOIN Users u ON o.user_id = u.user_id
LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- View: Cart details with product and album information
CREATE VIEW vw_cart_details AS
SELECT 
    ci.cart_item_id,
    ci.quantity,
    ci.created_at AS added_at,
    u.user_id,
    u.username,
    p.product_id,
    p.condition,
    p.price AS current_price,
    p.image_urls,
    a.album_id,
    a.title AS album_title,
    a.artist,
    a.cover_image_url
FROM Cart_Items ci
JOIN Users u ON ci.user_id = u.user_id
JOIN Products p ON ci.product_id = p.product_id
JOIN Albums a ON p.album_id = a.album_id;

-- View: User discussion activity
CREATE VIEW vw_user_discussions AS
SELECT 
    u.user_id,
    u.username,
    u.avatar_url,
    db.bubble_id,
    db.content,
    db.created_at
FROM Discussion_Bubbles db
JOIN Users u ON db.user_id = u.user_id
ORDER BY db.created_at DESC;

-- Triggers for data integrity

-- Trigger: Update order total when items are added/modified
CREATE TRIGGER update_order_total_after_insert
AFTER INSERT ON Order_Items
BEGIN
    UPDATE Orders 
    SET total_amount = (
        SELECT SUM(quantity * price_at_purchase)
        FROM Order_Items
        WHERE order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END;

CREATE TRIGGER update_order_total_after_update
AFTER UPDATE ON Order_Items
BEGIN
    UPDATE Orders 
    SET total_amount = (
        SELECT SUM(quantity * price_at_purchase)
        FROM Order_Items
        WHERE order_id = NEW.order_id
    )
    WHERE order_id = NEW.order_id;
END;

CREATE TRIGGER update_order_total_after_delete
AFTER DELETE ON Order_Items
BEGIN
    UPDATE Orders 
    SET total_amount = COALESCE((
        SELECT SUM(quantity * price_at_purchase)
        FROM Order_Items
        WHERE order_id = OLD.order_id
    ), 0)
    WHERE order_id = OLD.order_id;
END;

-- Trigger: Set paid_at when status changes to 'paid'
CREATE TRIGGER validate_order_paid
BEFORE UPDATE OF status ON Orders
WHEN NEW.status = 'paid' AND OLD.status != 'paid'
BEGIN
    UPDATE Orders SET paid_at = CURRENT_TIMESTAMP
    WHERE order_id = NEW.order_id;
END;

-- Trigger: Set shipped_at when status changes to 'shipped'
CREATE TRIGGER validate_order_shipped
BEFORE UPDATE OF status ON Orders
WHEN NEW.status = 'shipped' AND OLD.status != 'shipped'
BEGIN
    UPDATE Orders SET shipped_at = CURRENT_TIMESTAMP
    WHERE order_id = NEW.order_id;
END;

-- Trigger: Set completed_at when status changes to 'completed'
CREATE TRIGGER validate_order_completed
BEFORE UPDATE OF status ON Orders
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    UPDATE Orders SET completed_at = CURRENT_TIMESTAMP
    WHERE order_id = NEW.order_id;
END;

-- Trigger: Set cancelled_at when status changes to 'cancelled'
CREATE TRIGGER validate_order_cancelled
BEFORE UPDATE OF status ON Orders
WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
BEGIN
    UPDATE Orders SET cancelled_at = CURRENT_TIMESTAMP
    WHERE order_id = NEW.order_id;
END;

-- Trigger: Prevent adding to cart if product is inactive
CREATE TRIGGER prevent_inactive_cart_items
BEFORE INSERT ON Cart_Items
BEGIN
    SELECT CASE
        WHEN (SELECT is_active FROM Products WHERE product_id = NEW.product_id) = 0
        THEN RAISE(ABORT, 'Cannot add inactive product to cart')
    END;
END;

-- Trigger: Clean up cart after order placement
CREATE TRIGGER cleanup_cart_after_order
AFTER INSERT ON Orders
BEGIN
    DELETE FROM Cart_Items
    WHERE user_id = NEW.user_id;
END;