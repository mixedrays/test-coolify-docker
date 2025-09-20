import { Request, Response, NextFunction } from 'express';
import pool from './db';

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
    // IMPORTANT: In a real application, NEVER store plain text passwords.
    // Use a strong hashing algorithm like bcrypt.
    // This example uses plain text for simplicity ONLY.
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);

    if (result.rows.length > 0) {
      // Attach user info to request if needed later
      // req.user = result.rows[0];
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
