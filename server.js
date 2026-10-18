require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => {
	const databaseReady = mongoose.connection.readyState === 1;
	res.status(databaseReady ? 200 : 503).json({
		status: databaseReady ? 'ok' : 'unavailable',
		database: databaseReady ? 'connected' : 'disconnected'
	});
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/properties', require('./routes/tenantRoutes'));
app.use('/api/properties', require('./routes/rentRoutes'));
app.use('/api/properties', require('./routes/maintenanceRoutes'));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

async function start() {
	if (!process.env.MONGO_URI) {
		throw new Error('MONGO_URI is required');
	}
	if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me') {
		throw new Error('Set JWT_SECRET to a strong secret before starting the API');
	}

	await mongoose.connect(process.env.MONGO_URI);
	const port = process.env.PORT || 5000;
	return app.listen(port, () => console.log(`Property API listening on port ${port}`));
}

if (require.main === module) {
	start().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}

module.exports = app;