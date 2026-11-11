const express = require('express');
const cors = require('cors');

// Acá armo la API de Express. La separo del arranque para poder probarla sin abrir un puerto.
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Según lo que venga después de /api, Express lo manda a las rutas de usuarios, plazas, reportes o fotos.
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/square', require('./routes/square.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/uploads', require('./routes/uploads.routes'));
module.exports = app;
