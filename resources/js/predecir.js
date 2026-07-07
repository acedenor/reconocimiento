let datosFamososTemporales = [];
let nombreArchivoTemporal = "";
let nombreBucketTemporal = "";
let referencia = "";
async function subirImagen() {
  const input = document.getElementById('file-input');
  const contenedorTabla = document.getElementById('contenedorTabla');
  const cuerpoTabla = document.getElementById('db-rows');
  const mensajeNoResultados = document.getElementById('mensajeNoResultados');
  const btnGuardarDB = document.getElementById('btn-grabar');

  // 1. Ocultar elementos previos en cada nueva petición
  contenedorTabla.style.display = 'none';
  mensajeNoResultados.style.display = 'none';
  cuerpoTabla.innerHTML = ''; // Limpiar filas anteriores

  if (input.files.length === 0) {
    alert('Por favor, selecciona una imagen primero.');
    return;
  }

  // ¡CRUCIAL!: Añadir el [0] para tomar la imagen individual, no la lista
  const archivo = input.files[0]; 
  nombreArchivoTemporal = archivo.name;

  const convertirBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        // Quitamos el prefijo "data:image/jpeg;base64," para enviar solo los datos puros
        const base64Limpio = fileReader.result.split(',')[1];
        resolve(base64Limpio);
      };
      fileReader.onerror = (error) => reject(error);
    });
  };

  try {
    const imagenBase64 = await convertirBase64(archivo);
    const urlLambda = 'https://qrlfj46ehspwuo3t6pu4omdhoa0yvxnc.lambda-url.us-east-2.on.aws/'; 
    
    // 1. Solicitar la URL firmada
    const respuestaLambda = await fetch(urlLambda, {
      method: 'POST',
      body: JSON.stringify({ 
        nombreArchivo: archivo.name,
        imagenBase64: imagenBase64  
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const datos = await respuestaLambda.json();

    if (respuestaLambda.ok) {
      //Verifico que AWS si detectó famosos en la imagen.
      if(datos.famosos && datos.famosos.length > 0) {
        datosFamososTemporales = datos.famosos;
        nombreBucketTemporal = datos.bucket;
        nombreArchivoTemporal = datos.nombreArchivo;

        datos.famosos.forEach(famoso => {
          const fila = document.createElement('tr');
          // Crear enlaces para los URLs de información (ej. IMDB, Wikipedia)
          const enlaces = famoso.urls.length > 0
            ? famoso.urls.map(url => `<a href="https://${url}" target="_blank">Enlace</a>`).join(' | ')
            : 'No disponible'; 
          referencia = enlaces;         
          fila.innerHTML = `
            <td style="padding: 10px; font-weight: bold;">${famoso.nombre}</td>
            <td style="padding: 10px;">${famoso.confianza}%</td>
            <td style="padding: 10px;">${enlaces}</td>
          `;
          cuerpoTabla.appendChild(fila);
        });
        contenedorTabla.style.display = 'block';
        if (btnGuardarDB) {
          btnGuardarDB.onclick = ejecutarGuardadoEnDB;
        }
      }else{
        mensajeNoResultados.style.display = 'block';
      }
    } else {
      console.error('Error en Lambda:', datos);
      alert('Hubo un error al procesar la imagen.');
    }
  } catch (error) {
    console.error('Error en el proceso:', error);
    alert('Ocurrió un error al procesar la subida.');
  }
}

// Función encargada de enviar los datos exactos a la Lambda de PostgreSQL
async function ejecutarGuardadoEnDB() {
  const urlLambdaDB = 'https://qmpe2652reh562vy7k5vmfwlpi0mtpqh.lambda-url.us-east-2.on.aws/';
  const btnGuardarDB = document.getElementById('btn-grabar');

  try {
    btnGuardarDB.disabled = true;
    btnGuardarDB.innerText = "Guardando...";
    console.log('Imagen: ', nombreArchivoTemporal);
    console.log('Famosos: ', datosFamososTemporales);
    const respuesta = await fetch(urlLambdaDB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagen: nombreArchivoTemporal,
        bucket: nombreBucketTemporal,
        famosos: datosFamososTemporales
      })
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      alert(`¡Se guardó con éxito! ${resultado.mensaje}`);
      const inputArchivo = document.getElementById("file-input");
      inputArchivo.value = "";
      const vistaPrevia = document.getElementById("img-preview");
      vistaPrevia.removeAttribute("src"); // Elimina la imagen previa
      vistaPrevia.style.display = "none";
      datosFamososTemporales = [];
      nombreArchivoTemporal = '';
      nombreBucketTemporal ='';
      contenedorTabla.style.display = 'none;
    } else {
      alert(`No se pudo guardar la información. Motivo: ${resultado.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('No se guardó la información debido a un error de conexión.');
  } finally {
    btnGuardarDB.disabled = false;
    btnGuardarDB.innerText = "Guardar";
  }
}