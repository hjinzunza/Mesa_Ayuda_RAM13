
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Crear automáticamente la tabla si no existe
async function iniciarServidor() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.solicitudes_soporte (
                id_solicitud SERIAL PRIMARY KEY,
                nombre_trabajador VARCHAR(150) NOT NULL,
                departamento VARCHAR(150),
                tipo_problema VARCHAR(100) NOT NULL,
                descripcion TEXT NOT NULL,
                prioridad VARCHAR(20) DEFAULT 'Media',
                estado VARCHAR(30) DEFAULT 'Pendiente',
                fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tabla solicitudes_soporte lista');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor RAM13 funcionando en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('ERROR AL INICIAR:', error.message);
    }
}

// Consultar solicitudes
app.get('/api/solicitudes', async (req, res) => {
    try {
        const resultado = await db.query(
            'SELECT * FROM solicitudes_soporte ORDER BY fecha_creacion DESC'
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR AL CONSULTAR:', error.message);
        res.status(500).json({ error: 'Error al consultar las solicitudes' });
    }
});

// Registrar solicitud
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
        res.status(500).json({ error: 'Error al registrar la solicitud' });
    }
});

// Actualizar estado
app.put('/api/solicitudes/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const { id } = req.params;

        const estadosPermitidos = ['Pendiente', 'En proceso', 'Resuelto'];

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

iniciarServidor();


