import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from './db';

const SALT_ROUNDS = 10;

// Function to create a new user account
export const createUser = async (username: string, password: string): Promise<boolean> => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Insert the new user into the database
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

// Function to verify user credentials
export const verifyUser = async (username: string, password: string): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT password FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const hashedPassword = result.rows[0].password;
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

// Enhanced authentication middleware with account creation
export const enhancedAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area - Enter credentials or create new account"');
    return res.status(401).json({
      message: 'Authentication required. Use your existing credentials or create a new account.',
      hint: 'If you don\'t have an account, enter a new username and password to create one.'
    });
  }

  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic') {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area - Enter credentials or create new account"');
    return res.status(401).json({
      message: 'Basic authentication required.'
    });
  }

  const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
  const [username, password] = decodedCredentials.split(':');

  if (!username || !password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area - Enter credentials or create new account"');
    return res.status(401).json({
      message: 'Invalid credentials format. Please provide both username and password.'
    });
  }

  try {
    // First, try to verify existing user
    const userExists = await verifyUser(username, password);
    
    if (userExists) {
      // User authenticated successfully
      return next();
    }
    
    // Check if username already exists but password is wrong
    const existingUser = await pool.query('SELECT username FROM users WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      // Username exists but password is wrong
      res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area - Enter credentials or create new account"');
      return res.status(401).json({
        message: 'Invalid password for existing user.',
        hint: 'Please check your password or use a different username to create a new account.'
      });
    }
    
    // User doesn't exist, attempt to create new account
    const accountCreated = await createUser(username, password);
    
    if (accountCreated) {
      console.log(`New account created for user: ${username}`);
      return next(); // Allow access after account creation
    } else {
      return res.status(500).json({
        message: 'Failed to create new account. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      message: 'Internal Server Error during authentication.'
    });
  }
};

// Keep the original basicAuth for backward compatibility if needed
export const basicAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Authentication required.');
  }

  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic') {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Authentication required.');
  }

  const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
  const [username, password] = decodedCredentials.split(':');

  if (!username || !password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
    return res.status(401).send('Invalid credentials format.');
  }

  try {
    const isValid = await verifyUser(username, password);
    
    if (isValid) {
      return next(); // Authentication successful
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
      return res.status(401).send('Invalid username or password.');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).send('Internal Server Error during authentication.');
  }
};
