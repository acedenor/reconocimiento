import json
import logging
import psycopg2
import os
import sys 

user = os.environ['USER_NAME']
clave = os.environ['PASSWORD']
host = os.environ['RDS_HOST']
db = os.environ['DB_NAME']

logger = logging.getLogger()
logger.setLevel(logging.INFO)
def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])         
        lista_famosos = body.get('famosos', [])
        imagen = body.get('imagen')
        logger.info(f'Imagen {imagen}')
        logger.info(f'Famosos {lista_famosos}')
        nombre_archivo = "imagenes/"+imagen
        
        with psycopg2.connect(
            host=host,
            database=db,
            user=user,
            password=clave
        ) as conn:
            with conn.cursor() as cursor:
                filas_insertadas = 0                
                sql_insert = """
                INSERT INTO reconocimiento (nombre_imagen, nombre_famoso, porcentaje, fuente, fecha_registro)
                VALUES (%s, %s, %s, %s, NOW());                
                """

                for f in lista_famosos:
                    nombre_famoso = f.get('nombre')
                    confianza = f.get('confianza')
                    fuente = f.get('urls')
                    flinks = retornaEnlace(fuente)
                    valores = (imagen, nombre_famoso, float(confianza), flinks)
                    cursor.execute(sql_insert, valores)
                    filas_insertadas += 1
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'mensaje': f'Se almacenaron con éxito {filas_insertadas} celebridades en la base de datos.'
            })
        }    
    except Exception as e:
        logger.error("No se ha podido conectar a la base de datos")
        print(e)
        sys.exit(1)
def retornaEnlace(enlace):
    return " | ".join([f'<a href="https://{url.strip()}" target="_blank">Enlace</a>' for url in enlace if url])