import express, {Request, Response} from "express";
import dotenv from "dotenv";
import axios from "axios"; // Import axios
import {basicAuth, enhancedAuth} from "./auth";
import pool from "./db"; // Import pool to ensure db connection is attempted on start

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// Get Python service URL from environment variables set in docker-compose
const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'; // Default for local dev without docker
// Get Go service URL from environment variables
const goServiceUrl = process.env.GO_SERVICE_URL || 'http://localhost:8080'; // Default for local dev without docker

let count = 0;

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World! Public route.");
});

// Protected route with enhanced authentication
app.get("/protected", enhancedAuth, (req: Request, res: Response) => {
    res.json({
        message: `Welcome to the protected area! Count: ${count} times accessed.`,
        count: count,
        timestamp: new Date().toISOString(),
        info: "You successfully authenticated or created a new account!"
    });
    count++;
});

// Proxy route to Python service
app.get("/proxy-py", async (req: Request, res: Response) => {
    try {
        // Forward query parameters from the original request to the Python service
        const response = await axios.get(`${pythonServiceUrl}/py-data`, {
            params: req.query // Pass query parameters here
        });
        // Send the data received from Python service back to the client
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching data from Python service:", error);
        // Check if the error is an Axios error and has response data
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).send("Error communicating with Python service");
        } else {
            res.status(500).send("Internal server error while proxying to Python service");
        }
    }
});

// Proxy route to Go service
app.get("/proxy-go", async (req: Request, res: Response) => {
    try {
        // Make request to the Go service endpoint (e.g., /go-data)
        const response = await axios.get(`${goServiceUrl}/go-data`);
        // Send the data received from Go service back to the client
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching data from Go service:", error);
        // Check if the error is an Axios error and has response data
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).send("Error communicating with Go service");
        } else {
            res.status(500).send("Internal server error while proxying to Go service");
        }
    }
});

// Check DB connection route (optional)
app.get("/health", async (req: Request, res: Response) => {
    try {
        await pool.query("SELECT NOW()");
        res.status(200).send("OK");
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).send("Database connection failed");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
