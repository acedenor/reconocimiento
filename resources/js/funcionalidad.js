//Permite ver la imagen en la pagina antes de enviarla al servidor.
const fileUploader = document.getElementById('file-input');
const imgPreview = document.getElementById('img-preview');
const placeholderText = document.getElementById('placeholder-text');
fileUploader.addEventListener('change', function (event) {
    const file = event.target.files[0]; // Captura el primer archivo seleccionado
    if (file) {
        const reader = new FileReader();
        // Evento que se dispara cuando el archivo se termina de leer
        reader.onload = function (e) {
            imgPreview.src = e.target.result; // Asigna el contenido binario al src de la imagen
            imgPreview.style.display = 'block'; // Muestra la etiqueta img
            placeholderText.style.display = 'none'; // Oculta el texto de aviso
        }
        reader.readAsDataURL(file); // Convierte la imagen a un formato legible por el navegador
    } else {
        // Si el usuario cancela la selección, se limpia la vista previa
        imgPreview.style.display = 'none';
        placeholderText.style.display = 'block';
    }
});

//Otra funcionalidad de la página