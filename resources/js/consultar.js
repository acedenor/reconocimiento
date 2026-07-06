// 1. Simulación de datos (Reemplaza esto con tu URL real de API de ser necesario)
const urlApi = 'https://typicode.com';

// 2. Función para obtener los datos
async function obtenerDatos() {
    try {
        // Hacemos la petición a la API o Servidor
        const respuesta = await fetch(urlApi);
        const datos = await respuesta.json();

        // Llamamos a la función que dibuja la tabla
        mostrarDatos(datos);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        document.getElementById('cuerpo-tabla').innerHTML = `
                <tr>
                    <td colspan="4" style="color: red; text-align: center;">
                        Error al cargar los datos de la base de datos.
                    </td>
                </tr>`;
    }
}

// 3. Función para renderizar los datos en el HTML
function mostrarDatos(usuarios) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    cuerpoTabla.innerHTML = ''; // Limpiamos el mensaje de "Cargando..."

    // Recorremos los datos y creamos las filas
    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.name}</td>
                <td>${usuario.email}</td>
                <td>${usuario.company.name}</td>
            `;

        cuerpoTabla.appendChild(fila);
    });
}

// 4. Ejecutar la función al cargar la página
window.onload = obtenerDatos;