
const URL_API = 'https://mesa-ayuda-ram13.onrender.com/api/solicitudes';

let solicitudes = [];

const formulario = document.getElementById('formularioSolicitud');
const tabla = document.getElementById('tablaSolicitudes');
const busqueda = document.getElementById('busqueda');
const filtroEstado = document.getElementById('filtroEstado');
const mensajeCarga = document.getElementById('mensajeCarga');
const mensajeFormulario = document.getElementById('mensajeFormulario');
const botonEnviar = document.getElementById('botonEnviar');

// Consultar solicitudes desde PostgreSQL
async function cargarSolicitudes() {
    mensajeCarga.textContent = 'Cargando solicitudes...';
    mensajeCarga.classList.remove('d-none', 'alert-danger');
    mensajeCarga.classList.add('alert-info');

    try {
        const respuesta = await fetch(URL_API);

        if (!respuesta.ok) {
            throw new Error('No fue posible consultar las solicitudes.');
        }

        solicitudes = await respuesta.json();

        mensajeCarga.classList.add('d-none');
        actualizarEstadisticas();
        mostrarSolicitudes();

    } catch (error) {
        mensajeCarga.textContent =
            'No se pudo conectar con el servidor. Comprueba que esté funcionando.';
        mensajeCarga.classList.remove('d-none', 'alert-info');
        mensajeCarga.classList.add('alert-danger');
        console.error(error);
    }
}

// Mostrar solicitudes en la tabla
function mostrarSolicitudes() {
    const texto = busqueda.value.trim().toLowerCase();
    const estadoSeleccionado = filtroEstado.value;

    const filtradas = solicitudes.filter(solicitud => {
        const contenido = [
            solicitud.nombre_trabajador,
            solicitud.departamento,
            solicitud.tipo_problema,
            solicitud.descripcion
        ].join(' ').toLowerCase();

        const coincideTexto = contenido.includes(texto);
        const coincideEstado =
            !estadoSeleccionado || solicitud.estado === estadoSeleccionado;

        return coincideTexto && coincideEstado;
    });

    tabla.innerHTML = '';

    document.getElementById('sinResultados')
        .classList.toggle('d-none', filtradas.length !== 0);

    filtradas.forEach(solicitud => {
        const fila = document.createElement('tr');

        const celdas = [
            solicitud.id_solicitud,
            solicitud.nombre_trabajador,
            solicitud.departamento || 'No indicado',
            solicitud.tipo_problema,
            solicitud.prioridad,
            solicitud.estado,
            formatearFecha(solicitud.fecha_creacion)
        ];

        celdas.forEach((valor, indice) => {
            const celda = document.createElement('td');

            // Prioridad
            if (indice === 4) {
                const prioridad = document.createElement('span');
                prioridad.className = 'prioridad ' + clasePrioridad(valor);
                prioridad.textContent = valor;
                celda.appendChild(prioridad);

            // Estado modificable
            } else if (indice === 5) {
                const selector = document.createElement('select');

                selector.className = 'form-select form-select-sm';
                selector.style.minWidth = '125px';

                ['Pendiente', 'En proceso', 'Resuelto'].forEach(opcion => {
                    const elemento = document.createElement('option');
                    elemento.value = opcion;
                    elemento.textContent = opcion;
                    elemento.selected = opcion === valor;

                    selector.appendChild(elemento);
                });

                selector.addEventListener('change', async () => {
                    selector.disabled = true;
                    await actualizarEstado(
                        solicitud.id_solicitud,
                        selector.value
                    );
                    selector.disabled = false;
                });

                celda.appendChild(selector);

            } else {
                celda.textContent = valor ?? '';
            }

            fila.appendChild(celda);
        });

        tabla.appendChild(fila);
    });
}

// Dar formato a la fecha
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Clases visuales según el estado
function claseEstado(estado) {
    if (estado === 'Pendiente') return 'estado-pendiente';
    if (estado === 'En proceso') return 'estado-proceso';
    return 'estado-resuelto';
}

// Clases visuales según la prioridad
function clasePrioridad(prioridad) {
    if (prioridad === 'Alta') return 'prioridad-alta';
    if (prioridad === 'Media') return 'prioridad-media';
    return 'prioridad-baja';
}

// Actualizar indicadores de la página
function actualizarEstadisticas() {
    document.getElementById('totalSolicitudes').textContent =
        solicitudes.length;

    document.getElementById('totalPendientes').textContent =
        solicitudes.filter(s => s.estado === 'Pendiente').length;

    document.getElementById('totalResueltas').textContent =
        solicitudes.filter(s => s.estado === 'Resuelto').length;
}

// Registrar una nueva solicitud en PostgreSQL
formulario.addEventListener('submit', async function(evento) {
    evento.preventDefault();

    mensajeFormulario.textContent = '';
    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando...';

    const nuevaSolicitud = {
        nombre_trabajador: document.getElementById('nombre').value.trim(),
        departamento: document.getElementById('departamento').value.trim(),
        tipo_problema: document.getElementById('tipoProblema').value,
        descripcion: document.getElementById('descripcion').value.trim(),
        prioridad: document.getElementById('prioridad').value
    };

    try {
        const respuesta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaSolicitud)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || 'No se pudo registrar la solicitud.'
            );
        }

        mensajeFormulario.textContent =
            '¡Solicitud registrada correctamente!';
        mensajeFormulario.className =
            'mensaje-formulario mt-3 text-success';

        formulario.reset();

        await cargarSolicitudes();

    } catch (error) {
        mensajeFormulario.textContent = error.message;
        mensajeFormulario.className =
            'mensaje-formulario mt-3 text-danger';
        console.error(error);

    } finally {
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Enviar solicitud';
    }
});

// Cambiar el estado de una solicitud en PostgreSQL
async function actualizarEstado(id, nuevoEstado) {
    try {
        const respuesta = await fetch(
            `${URL_API}/${id}/estado`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || 'No se pudo actualizar el estado.'
            );
        }

        await cargarSolicitudes();

        alert('Estado actualizado correctamente.');

    } catch (error) {
        alert(error.message);
        await cargarSolicitudes();
    }
}

// Eventos para buscar y filtrar
busqueda.addEventListener('input', mostrarSolicitudes);
filtroEstado.addEventListener('change', mostrarSolicitudes);

// Cargar información al abrir la página
cargarSolicitudes();
