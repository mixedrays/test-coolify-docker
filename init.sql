CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a sample user (use hashed password in production)
-- Example: username=testuser, password=testpass
INSERT INTO users (username, password) VALUES ('testuser', 'testpass') ON CONFLICT (username) DO NOTHING;
