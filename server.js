const axios = require('axios');
const cheerio = require('cheerio');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const cron = require('node-cron');
const express = require('express');

// MySQL Configuration
const dbConfig = {
    host: 'localhost',
    user: 'hackernews_user',
    password: 'your_password',
    database: 'hackernews'
};

// Create WebSocket Server
const app = express();
const PORT = process.env.PORT || 8081; // Changed port to 8081
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

// Array to keep track of connected WebSocket clients
let clients = [];

// Function to scrape Hacker News
async function scrapeHackerNews() {
    try {
        const response = await axios.get('https://news.ycombinator.com/');
        const $ = cheerio.load(response.data);
        const stories = [];

        $('.athing').each((i, el) => {
            const id = $(el).attr('id');
            const title = $(el).find('.titleline > a').text();
            const url = $(el).find('.titleline > a').attr('href');
            stories.push({ id, title, url, timestamp: new Date() });
        });

        // Save to MySQL
        const connection = await mysql.createConnection(dbConfig);
        for (const story of stories) {
            await connection.execute(
                'INSERT IGNORE INTO stories (id, title, url, timestamp) VALUES (?, ?, ?, ?)',
                [story.id, story.title, story.url, story.timestamp]
            );
        }
        await connection.end();

        // Broadcast the new stories to all connected clients
        for (const client of clients) {
            client.send(JSON.stringify({ type: 'new', data: stories }));
        }
    } catch (error) {
        console.error('Error scraping Hacker News:', error);
    }
}

// Send stories from the last 5 minutes to WebSocket clients
async function getRecentStories() {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
        'SELECT * FROM stories WHERE timestamp >= NOW() - INTERVAL 5 MINUTE'
    );
    await connection.end();
    return rows;
}

// WebSocket Handlers
wss.on('connection', async (ws) => {
    console.log('Client connected');
    clients.push(ws); // Add the new client to the array

    // Send stories from the last 5 minutes on initial connection
    const recentStories = await getRecentStories();
    ws.send(JSON.stringify({ type: 'recent', data: recentStories }));

    // Remove the client from the list on close
    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

// Periodic Scraping using Cron (Every 5 minutes)
cron.schedule('*/5 * * * *', scrapeHackerNews);

// Ensure database table exists
async function setupDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stories (
                id VARCHAR(255) PRIMARY KEY,
                title TEXT,
                url TEXT,
                timestamp DATETIME
            )
        `);
        await connection.end();
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase().then(scrapeHackerNews);
