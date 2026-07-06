import json
import boto3
import os

# Inicializamos el cliente de la API de Datos de RDS en la región de tu infraestructura
rds_client = boto3.client('rds-data', region_name='us-east-2')

# Reemplaza estos valores por los ARNs correspondientes de tu clúster de Aurora y Secrets Manager
CLUSTER_ARN = "arn:aws:rds:us-east-2:097279985795:cluster:tu-cluster-aurora"
SECRET_ARN = "arn:aws:secretsmanager:us-east-2:097279985795:secret:tu-secreto-credenciales"
DB_NAME = "nombre_de_tu_base_de_datos"

def lambda_handler(event, context):
    # Control manual de CORS Preflight
    request_context = event.get('requestContext', {})
    if request_context.get('http', {}).get('method', '') == 'OPTIONS':
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

    try:
        body = json.loads(event.get('body', '{}'))
        nombre_archivo = body.get('nombreArchivo', 'desconocido.jpg')
        lista_famosos = body.get('famosos', [])

        if not lista_famosos:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': 'http://127.0.0.1:5500'},
                'body': json.dumps({'error': 'No se encontraron registros de famosos para procesar'})
            }

        # Consulta SQL parametrizada para evitar inyecciones
        sql_insert = """
            INSERT INTO reconocimiento (imagen, bucket, famoso, confianza, fecha)
            VALUES (:nombre_archivo, :nombre_famoso, :confianza);
        """

        filas_insertadas = 0

        # Iterar el arreglo enviado por JS e insertar cada registro individual en Aurora
        for famoso in lista_famosos:
            nombre_famoso = famoso.get('nombre')
            confianza = famoso.get('confianza')

            parametros = [
                {'name': 'nombre_archivo', 'value': {'stringValue': nombre_archivo}},
                {'name': 'nombre_famoso', 'value': {'stringValue': nombre_famoso}},
                {'name': 'confianza', 'value': {'doubleValue': float(confianza)}}
            ]

            rds_client.execute_statement(
                resourceArn=CLUSTER_ARN,
                secretArn=SECRET_ARN,
                database=DB_NAME,
                sql=sql_insert,
                parameters=parametros
            )
            filas_insertadas += 1

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'mensaje': f'Se almacenaron con éxito {filas_insertadas} celebridades en la base de datos.'
            })
        }

    except Exception as e:
        print(f"Error crítico en DB: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': 'http://127.0.0.1:5500',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Error interno al intentar guardar los datos',
                'detalle': str(e)
            })
        }