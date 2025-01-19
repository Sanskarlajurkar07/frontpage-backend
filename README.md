FrontPage Backend Service
Project Description
This Node.js service scrapes real-time stories from Hacker News, stores them in a MySQL database, and broadcasts updates to clients via WebSocket. The purpose is to provide real-time updates on new stories and keep track of stories published in the last 5 minutes.
  
Features
- Scrapes stories from Hacker News every 5 minutes.
- Stores the scraped stories in a MySQL database.
- Provides real-time updates to connected WebSocket clients.
- Sends stories published in the last 5 minutes to new connections.

Setup Instructions
Prerequisites
- Node.js and npm installed
- MySQL installed and running

 Installation
1. Clone the repository:
   git clone https://github.com/Sanskarlajurkar07/frontpage-backend.git
   cd frontpage-backend

Install dependencies:
npm install

Create the required table:
USE hackernews;
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT,
    url TEXT,
    timestamp DATETIME
);

Create a .env file:
env
DB_HOST=localhost
DB_USER=hackernews_user
DB_PASSWORD=your_password
DB_DATABASE=hackernews
PORT=8081
Run the server:
node server.js
WebSocket API
Connect to ws://localhost:8081 to receive real-time updates.
