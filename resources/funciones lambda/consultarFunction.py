import json
import logging
import psycopg2
import os
import sys 
from psycopg2.extras import RealDictCursor 

user = os.environ['USER_NAME']
clave = os.environ['PASSWORD']
host = os.environ['RDS_HOST']
db = os.environ['DB_NAME']
bucket = os.environ['BUCKET']

logger = logging.getLogger()
logger.setLevel(logging.INFO)
def lambda_handler(event, context):
    try:        
        with psycopg2.connect(
            host=host,
            database=db,
            user=user,
            password=clave
        ) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:                               
                sql = """
                SELECT nombre_imagen, nombre_famoso, porcentaje, fuente, fecha_registro 
                FROM reconocimiento 
                ORDER BY fecha_registro DESC;
                """
                cursor.execute(sql)
                filas = cursor.fetchall()
                reg = []
                for f in filas:                    
                    reg.append({
                        'nombre_imagen': bucket+f['nombre_imagen'],
                        'nombre_famoso': f['nombre_famoso'],
                        'porcentaje': float(f['porcentaje']),
                        'fuente': f['fuente'], 
                        'fecha_registro': str(f['fecha_registro'])
                    })
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(reg)
        } 
    except Exception as e:
        logger.error(f"Error al consultar la base de datos: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'  # <-- Crucial añadirlo aquí también
            },
            'body': json.dumps({
                'error': 'No se pudieron obtener los registros',
                'detalle': str(e) # Te ayudará a ver el error real en la consola de JS
            })
        }