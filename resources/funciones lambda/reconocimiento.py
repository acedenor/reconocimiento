import json
import boto3
import base64
from botocore.config import Config

# Configuramos los clientes de AWS en la región de tu bucket (us-east-2)
s3_client = boto3.client('s3', region_name='us-east-2', config=Config(signature_version='s3v4'))
rekognition_client = boto3.client('rekognition', region_name='us-east-2')

def lambda_handler(event, context):
    # 1. Interceptar peticiones OPTIONS (CORS Preflight)
    request_context = event.get('requestContext', {})
    http_method = request_context.get('http', {}).get('method', '')

    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps('CORS OK')
        }

    # 2. Procesar la subida y el reconocimiento (POST)
    try:
        body_str = event.get('body', '{}')
        body = json.loads(body_str)
        
        nombre_archivo = body.get('nombreArchivo', 'famoso.jpg')
        imagen_base64 = body.get('imagenBase64') # Cadena de texto base64
        
        if not imagen_base64:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': 'http://127.0.0.1:5500'},
                'body': json.dumps({'error': 'No se recibió ninguna imagen'})
            }

        # 3. Decodificar la imagen Base64 a bytes binarios
        imagen_bytes = base64.b64decode(imagen_base64)
        
        nombre_bucket = "bucketreconocimiento"
        key_archivo = f"imagenes/{nombre_archivo}"

        # 4. Guardar la imagen en el Bucket de S3
        s3_client.put_object(
            Bucket=nombre_bucket,
            Key=key_archivo,
            Body=imagen_bytes,
            ContentType='image/jpeg'
        )
        print(f"Imagen guardada con éxito en S3: {key_archivo}")

        # 5. Invocar a AWS Rekognition para reconocer celebridades
        respuesta_rekognition = rekognition_client.recognize_celebrities(
            Image={
                'S3Object': {
                    'Bucket': nombre_bucket,
                    'Name': key_archivo
                }
            }
        )

        # 6. Extraer y formatear los resultados de los famosos detectados
        famosos_detectados = []
        for celebridad in respuesta_rekognition.get('CelebrityFaces', []):
            famosos_detectados.append({
                'nombre': celebridad.get('Name'),
                'confianza': round(celebridad.get('MatchConfidence', 0), 2),
                'urls': celebridad.get('Urls', [])
            })

        print(f"Famosos encontrados: {famosos_detectados}")

        # 7. Retornar la respuesta JSON limpia hacia tu frontend
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'mensaje': 'Imagen procesada exitosamente',
                'famosos': famosos_detectados,
                'rutaS3': f"s3://{nombre_bucket}/{key_archivo}"
            })
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Error al procesar la imagen', 'detalle': str(e)})
        }
