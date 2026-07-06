async function subirImagen() {
  const input = document.getElementById('file-input');
  if (input.files.length === 0) {
    alert('Por favor, selecciona una imagen primero.');
    return;
  }

  // ¡CRUCIAL!: Añadir el [0] para tomar la imagen individual, no la lista
  const archivo = input.files[0]; 

  try {
    const urlLambda = 'https://qrlfj46ehspwuo3t6pu4omdhoa0yvxnc.lambda-url.us-east-2.on.aws/'; 
    
    // 1. Solicitar la URL firmada
    const respuestaLambda = await fetch(urlLambda, {
      method: 'POST',
      body: JSON.stringify({ 
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type 
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const datos = await respuestaLambda.json();
    const urlSubida = datos.uploadUrl;

    // 2. Subir el archivo de imagen directamente a S3
    const resultadoS3 = await fetch(urlSubida, {
      method: 'PUT',
      body: archivo, // Aquí pasamos el archivo individual corregido
      headers: {
        'Content-Type': archivo.type // Debe coincidir con el tipo exacto que procesó Python
      }
    });

    if (resultadoS3.ok) {
      alert('¡Imagen subida con éxito directamente a S3!');
    } else {
      // Si S3 responde con error, imprimimos el texto para ver qué no le gustó
      const textoError = await resultadoS3.text();
      console.error('Error detallado de S3:', textoError);
      alert('Error al subir el archivo a S3.');
    }

  } catch (error) {
    console.error('Error en el proceso:', error);
    alert('Ocurrió un error al procesar la subida.');
  }
}
