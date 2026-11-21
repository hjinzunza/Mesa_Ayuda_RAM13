
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL
const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Comprobar conexión
db.connect()
    .then(client => {
        console.log('Conexión con PostgreSQL exitosa');
        client.release();
    })
    .catch(error => {
        console.error('Error al conectar con PostgreSQL:', error.message);
    });

// Consultar solicitudes
app.get('/api/solicitudes', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT * FROM solicitudes_soporte ORDER BY fecha_creacion DESC'
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error('ERROR AL CONSULTAR:', error.message);
        res.status(500).json({
            error: 'Error al consultar las solicitudes'
        });
    }
});

// Registrar una nueva solicitud
app.post('/api/solicitudes', async (req, res) => {
    try {
        const {
            nombre_trabajador,
            departamento,
            tipo_problema,
            descripcion,
            prioridad
        } = req.body;

        if (!nombre_trabajador || !tipo_problema || !descripcion) {
            return res.status(400).json({
                error: 'Completa los campos obligatorios'
            });
        }

        const resultado = await db.query(
            `INSERT INTO solicitudes_soporte
            (nombre_trabajador, departamento, tipo_problema, descripcion, prioridad)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                nombre_trabajador,
                departamento || null,
                tipo_problema,
                descripcion,
                prioridad || 'Media'
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error('ERROR AL REGISTRAR:', error.message);

        res.status(500).json({
            error: 'Error al registrar la solicitud'
        });
    }
});

// Actualizar el estado de una solicitud
app.put('/api/solicitudes/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const { id } = req.params;

        const estadosPermitidos = [
            'Pendiente',
            'En proceso',
            'Resuelto'
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                error: 'El estado seleccionado no es válido'
            });
        }

        const resultado = await db.query(
            `UPDATE solicitudes_soporte
             SET estado = $1
             WHERE id_solicitud = $2
             RETURNING *`,
            [estado, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'No se encontró la solicitud'
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error('ERROR AL ACTUALIZAR:', error.message);

        res.status(500).json({
            error: 'No se pudo actualizar el estado'
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor RAM13 funcionando en http://localhost:${PORT}`);
});

