        // REEMPLAZA ESTA URL POR LA URL DE TU NUEVA LAMBDA
        const LAMBDA_URL = "https://4j7oc4fovwjv2cmu4cx5apq73i0zfvzz.lambda-url.us-east-2.on.aws/";

        // Función que consulta los datos a la Lambda
        async function cargarRegistros() {
            const tabla = document.getElementById("tabla-resultados");
            const cuerpoTabla = document.getElementById("cuerpo-tabla");
            const mensajeCarga = document.getElementById("mensaje-carga");

            try {
                const respuesta = await fetch(LAMBDA_URL, { method: "GET" });
                
                if (!respuesta.ok) {
                    throw new Error(`Error en la respuesta del servidor: ${respuesta.status}`);
                }
                const datos = await respuesta.json();
                // Limpiar la tabla antes de llenarla por seguridad
                if (!cuerpoTabla) return;
                cuerpoTabla.innerHTML = "";

                 if (datos.length === 0) {
                    if (mensajeCarga) mensajeCarga.innerText = "No hay registros disponibles.";
                    return;
                }
                // 1. AGRUPAR LOS REGISTROS POR IMAGEN
                const gruposPorImagen = {};
                // Recorrer los datos e insertarlos fila por fila
                datos.forEach(registro => {
                    if (!gruposPorImagen[registro.nombre_imagen]) {
                        gruposPorImagen[registro.nombre_imagen] = [];
                    }
                    gruposPorImagen[registro.nombre_imagen].push(registro);                    
                });

// 2. RENDERIZAR LA TABLA CON LAS FILAS AGRUPADAS
                Object.keys(gruposPorImagen).forEach(urlImagen => {
                    const registros = gruposPorImagen[urlImagen];
                    const totalFilas = registros.length;

                    registros.forEach((registro, indice) => {
                        const fila = document.createElement("tr");

                        // Si es el primer registro de este grupo, crea la celda de la imagen con rowspan
                        let celdaImagen = "";
                        if (indice === 0) {
                            celdaImagen = `
                                <td rowspan="${totalFilas}" style="vertical-align: middle; text-align: center;">
                                    <img src="${urlImagen}" alt="Aspirante" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
                                </td>
                            `;
                        }

                        // Columnas restantes individuales para cada persona detectada
                        fila.innerHTML = `
                            ${celdaImagen}
                            <td><strong>${registro.nombre_famoso}</strong></td>
                            <td>${registro.porcentaje}%</td>
                            <td>${registro.fuente}</td>
                            <td>${registro.fecha_registro}</td>
                        `;

                        cuerpoTabla.appendChild(fila);
                    });
                });

                if (mensajeCarga) mensajeCarga.style.display = "none";
                if (tabla) tabla.style.display = "table";


            } catch (error) {
                console.error("Error al obtener datos:", error);
                if (mensajeCarga) {
                    mensajeCarga.innerText = "Error crítico al conectar con el sistema de registros.";
                    mensajeCarga.style.color = "red";
                }
            }
        }

        // Ejecutar de forma automática e inmediata en cuanto el navegador cargue el HTML
        window.onload = cargarRegistros;