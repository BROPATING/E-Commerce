import 'dotenv/config';
import 'reflect-metadata';
import app from "./app";
import { AppDataSource } from "./config/data-source";

/**
 * Server Initialization Script
 * This file coordinates the connection between the Database and the Express Server.
 */

// Define the port from environment variables or default to 3000
const PORT = Number(process.env.PORT) || 3000;

/**
 * Step 1: Initialize the Data Source (Database Connection)
 * We do not start the Express server until the database is confirmed to be online.
 */
AppDataSource.initialize()  // Handshaking with MySQL
    .then(() => {
        console.log("DataBase Connected Successfully");
        app.listen(PORT, () => {
            console.log(`Sever is running on http://localhost:${PORT}`);
        })
    })
    .catch(err => {
        console.error(`DataBase Connection Failed Error: `, err);
        // Exit code 1 indicates an "Uncaught Fatal Exception" "crashed! Something is broken!"
        process.exit(1);
    }) 

/**
 * Example of process.exit()
 * No process.exit: Your server is a "Zombie" (looks alive, but dead inside).
 * process.exit(1): Your server is "Honest" (it stops so it can be fixed or restarted).
 */
