-- Set existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- To make a user an admin:
UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
