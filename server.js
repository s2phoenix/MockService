const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const MOCK_BASE = path.join(__dirname, 'mock_response');
const DOWN_FILE = path.join(__dirname, 'down_services.json');

app.use(express.json());

app.use('/mock', (req, res) => {
    const relativePath = req.path.replace(/^\/+/, '');
    const fullUrl = `/mock/${relativePath}`;
    const filePath = path.join(MOCK_BASE, relativePath+'.json');
    // Check if service is down
    const downList = getDownServices();
    if (downList[fullUrl]) {
        console.warn(`⚠️ Simulated failure: ${fullUrl} is marked down`);
        return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }

    // Load mock JSON file config down_service.json
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Mock file not found.' });
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        console.error('❌ Error reading mock file:', err.message);
        res.status(500).json({ error: 'Failed to read mock response.' });
    }
});

const getDownServices = () => {
    if (!fs.existsSync(DOWN_FILE)) return {};
    return JSON.parse(fs.readFileSync(DOWN_FILE, 'utf8'));
};

app.post('/config/downservice', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Missing parameter: name' });
    }

    const downList = getDownServices();
    downList[name] = true;
    fs.writeFileSync(DOWN_FILE, JSON.stringify(downList, null, 2));
    console.log(`🔴 Service marked down: ${name}`);
    res.json({ message: `Service ${name} is now down.` });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Mock server running at http://localhost:${PORT}`);
});
