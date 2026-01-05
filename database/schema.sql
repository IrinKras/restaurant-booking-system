-- Database Schema for Restaurant Booking System
-- PostgreSQL Database
-- Created: January 2026

-- ============================================
-- Table: users
-- Description: Stores user accounts (customers and admins)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Table: restaurants
-- Description: Restaurant information and settings
-- ============================================

CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    opening_time TIME NOT NULL DEFAULT '10:00:00',
    closing_time TIME NOT NULL DEFAULT '22:00:00',
    total_tables INT NOT NULL DEFAULT 15,
    max_guests_per_table INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default restaurant
INSERT INTO restaurants (name, address, phone, email, total_tables)
VALUES ('Restaurant Demo', 'Sofia, Bulgaria', '+359 2 123 4567', 'contact@restaurant.bg', 15)
ON CONFLICT DO NOTHING;

-- ============================================
-- Table: tables
-- Description: Restaurant tables and their capacity
-- ============================================

CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    location VARCHAR(50), -- 'indoor', 'outdoor', 'terrace'
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample tables
INSERT INTO tables (restaurant_id, table_number, capacity, location)
VALUES 
    (1, 'T01', 2, 'indoor'),
    (1, 'T02', 2, 'indoor'),
    (1, 'T03', 4, 'indoor'),
    (1, 'T04', 4, 'indoor'),
    (1, 'T05', 4, 'indoor'),
    (1, 'T06', 6, 'indoor'),
    (1, 'T07', 6, 'indoor'),
    (1, 'T08', 8, 'indoor'),
    (1, 'T09', 4, 'outdoor'),
    (1, 'T10', 4, 'outdoor'),
    (1, 'T11', 6, 'outdoor'),
    (1, 'T12', 2, 'terrace'),
    (1, 'T13', 2, 'terrace'),
    (1, 'T14', 4, 'terrace'),
    (1, 'T15', 4, 'terrace')
ON CONFLICT DO NOTHING;

-- ============================================
-- Table: bookings
-- Description: Customer reservations
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    table_id INT REFERENCES tables(id) ON DELETE SET NULL,
    restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Guest information (for non-registered users)
    guest_name VARCHAR(200) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    
    -- Booking details
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    number_of_guests INT NOT NULL CHECK (number_of_guests > 0),
    
    -- Status: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- Special requests
    special_requests TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Constraint: Cannot book in the past
    CONSTRAINT booking_future_date CHECK (booking_date >= CURRENT_DATE)
);

-- Indexes for faster queries
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_user ON bookings(user_id);

-- ============================================
-- Table: notifications
-- Description: Email notifications sent to customers
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'cancellation'
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);

-- ============================================
-- Table: availability_overrides
-- Description: Special availability rules (holidays, events)
-- ============================================

CREATE TABLE IF NOT EXISTS availability_overrides (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    custom_opening_time TIME,
    custom_closing_time TIME,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(restaurant_id, override_date)
);

-- ============================================
-- Table: audit_log
-- Description: Tracks important system events
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'create_booking', 'cancel_booking', 'update_booking'
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'user', 'table'
    entity_id INT,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- Views for reporting
-- ============================================

-- View: Daily bookings summary
CREATE OR REPLACE VIEW v_daily_bookings AS
SELECT 
    booking_date,
    COUNT(*) as total_bookings,
    SUM(number_of_guests) as total_guests,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
FROM bookings
GROUP BY booking_date
ORDER BY booking_date DESC;

-- View: Table utilization
CREATE OR REPLACE VIEW v_table_utilization AS
SELECT 
    t.table_number,
    t.capacity,
    t.location,
    COUNT(b.id) as total_bookings,
    AVG(b.number_of_guests) as avg_guests
FROM tables t
LEFT JOIN bookings b ON t.id = b.table_id
WHERE b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY t.id, t.table_number, t.capacity, t.location
ORDER BY total_bookings DESC;

-- ============================================
-- Functions
-- ============================================

-- Function: Check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
    p_date DATE,
    p_time TIME,
    p_guests INT
)
RETURNS TABLE(table_id INT, table_number VARCHAR, capacity INT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.table_number, t.capacity
    FROM tables t
    WHERE t.capacity >= p_guests
    AND t.is_available = true
    AND NOT EXISTS (
        SELECT 1 
        FROM bookings b
        WHERE b.table_id = t.id
        AND b.booking_date = p_date
        AND b.booking_time = p_time
        AND b.status IN ('confirmed', 'pending')
    )
    ORDER BY t.capacity ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Insert test user
INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
VALUES 
    ('admin@restaurant.bg', '$2b$10$abcdefghijklmnopqrstuv', 'Admin', 'User', '+359 888 123 456', 'admin'),
    ('test@customer.bg', '$2b$10$abcdefghijklmnopqrstuv', 'Test', 'Customer', '+359 888 654 321', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (
    restaurant_id, 
    table_id, 
    guest_name, 
    guest_email, 
    guest_phone, 
    booking_date, 
    booking_time, 
    number_of_guests,
    status
)
VALUES 
    (1, 3, 'Иван Петров', 'ivan@example.com', '+359 888 111 222', CURRENT_DATE + INTERVAL '1 day', '19:00:00', 4, 'confirmed'),
    (1, 6, 'Мария Георгиева', 'maria@example.com', '+359 888 333 444', CURRENT_DATE + INTERVAL '2 days', '20:00:00', 6, 'confirmed'),
    (1, 1, 'Георги Иванов', 'georgi@example.com', '+359 888 555 666', CURRENT_DATE + INTERVAL '3 days', '18:30:00', 2, 'pending')
ON CONFLICT DO NOTHING;

-- ============================================
-- End of Schema
-- ============================================

-- Grant permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO restaurant_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO restaurant_app;
