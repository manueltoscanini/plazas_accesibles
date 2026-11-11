# Entidades — Laboratorio 2 .NET

Archivo editable: `entidades_modelos.drawio`.

Creado con las funciones de autoría de CLI-Anything draw.io. Contiene dos páginas:

1. **Entidades y relaciones:** las siete entidades, sus atributos y los vínculos de plazas con baños, juegos, rampas, peligros y reportes.
2. **Reportes y usuarios:** todos los atributos de Report y sus cinco relaciones con User, incluyendo votos y revisión directa.

Fuente: [Documento modelos](https://docs.google.com/document/d/15zNIaKjulXEgN9O7NYvCQa2mFl9X1IDOeQhBfVDFpvY/edit), consultado el 05/11/2026. `documento_modelos_fuente.txt` conserva la sección Modelos usada para comprobar los atributos.

Copia en la [carpeta compartida de Drive](https://drive.google.com/file/d/1M1SjUGKLivTk_bkvbWryDsmbppAOtGDM/view?usp=drivesdk).

## Criterios

- Se mantienen las referencias ObjectId y los objetos/arreglos embebidos del modelo documental. No se agregan tablas intermedias ni atributos de roles.
- La obligatoriedad de `publicSquareId` y `userId`, la posibilidad de cero hijos/reportes y la revisión directa opcional son interpretaciones señaladas en el diagrama; el documento no declara todas las restricciones.
- Se conservan `PublicSquare.hazards.hazards` y `PublicSquareHazard`: el documento no explica la coexistencia de ambas representaciones.
- Los objetos `changes`, `add*`, `modify*` y `delete*` no se expanden porque su estructura no está especificada.

`generar_diagrama.py --output RUTA.drawio` permite regenerar el archivo con el harness local indicado en el script. Comprueba entidades, referencias, atributos de Report, IDs y extremos de los conectores. La validación estructural pasó; la exportación visual del draw.io de escritorio no estuvo disponible en esta sesión.
