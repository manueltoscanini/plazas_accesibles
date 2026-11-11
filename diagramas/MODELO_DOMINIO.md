# Modelo de dominio — Plazas y accesibilidad

Los usuarios consultan la información de accesibilidad de las plazas y proponen actualizaciones mediante reportes. La comunidad puede confirmar o refutar esos reportes; los administradores y usuarios de confianza pueden aprobarlos o rechazarlos directamente.

El modelo está en `modelo_dominio.drawio`, en un diagrama UML editable. La fuente funcional es [Documento modelos](https://docs.google.com/document/d/15zNIaKjulXEgN9O7NYvCQa2mFl9X1IDOeQhBfVDFpvY/edit). La referencia de notación es [Programación 4 — Análisis: Modelado del Dominio](https://docs.google.com/presentation/d/1Acru56Sumv7mjbZv2AY98f3H0_-4BwZI/edit?slide=id.p37#slide=id.p37), especialmente los apartados sobre atributos, multiplicidades, roles y agregación.

[Copia del modelo de dominio en la carpeta compartida de Drive](https://drive.google.com/file/d/1N6PK8BT6ZPKIWiZtFpeSZmxUOY6eZdna/view?usp=drivesdk).

## Conceptos y tipos

- **Plaza:** nombre, descripción, descripción de accesibilidad, ubicación, fotografías y última actualización. Corresponde a PublicSquare.
- **Baño, ZonaDeJuegos y Rampa:** instalaciones de la plaza. Corresponden a PublicSquareWC, PublicSquarePlayground y PublicSquareRamp.
- **Peligro:** condición o riesgo localizado en una plaza. Corresponde a PublicSquareHazard y a la descripción de peligros embebida en PublicSquare; ambas representan el mismo concepto del dominio.
- **DescripciónDeSenderos:** información sobre la existencia y accesibilidad del conjunto de senderos. Corresponde al objeto paths; no se presupone un inventario de caminos individuales.
- **Usuario:** persona identificada por su nombre, apellido y correo, con una condición de habilitación. Corresponde a User. Administrador y usuario de confianza se consideran roles para la revisión.
- **Reporte:** propuesta de actualización de información sobre una plaza. Corresponde a Report.
- **Coordenada:** tipo de valor compuesto por latitud y longitud. Se usa como tipo de atributo; no se trata como entidad con identidad propia.
- **PropuestaDeCambios:** tipo de valor que reúne lo propuesto en un reporte. Su estructura interna debe especificarse al precisar los requisitos. Los campos changes, add*, modify* y delete* motivan este tipo; no se inventan atributos internos.

Se usan además los tipos Texto, Real, Booleano, FechaHora e Imagen. Imagen representa el valor de una fotografía.

## Asociaciones

Cada baño, zona de juegos y rampa está asociado con una plaza; una plaza puede disponer de cero o más de cada uno. Se usa **agregación compartida**, con rombo vacío junto a Plaza, siguiendo la diapositiva 37. El documento no define reglas de ciclo de vida que justifiquen composición o borrado en cascada.

Una plaza presenta cero o más peligros y tiene cero o una descripción de senderos. Es objeto de cero o más reportes. Cada reporte trata una plaza y tiene un autor.

Entre Usuario y Reporte se distinguen cinco asociaciones: crea, confirma, refuta, aprueba directamente y rechaza directamente. Las multiplicidades y los roles se muestran junto a los extremos. Cada reporte puede tener varios confirmadores o refutadores y, como máximo, un aprobador y un revisor de rechazo directos. Un usuario puede participar en varios reportes.

Las confirmaciones y revisiones se expresan mediante asociaciones con roles. No requieren conceptos adicionales porque el documento no les asigna información propia.

## Restricciones y decisiones

Son requisitos declarados la unicidad del correo y la intervención de usuarios de confianza o administradores en la revisión directa. La aprobación automática se basa en confirmaciones, pero su umbral no está especificado.

Se interpretan como obligatorias las asociaciones de cada elemento con una plaza y de cada reporte con su plaza y autor. Se admite la ausencia de decisiones directas y de información sobre senderos. Estas multiplicidades deben confirmarse al precisar los requisitos.

Se deja pendiente la exclusión entre votos positivos y negativos, entre aprobación y rechazo, la posible autoconfirmación, el umbral automático y la estructura de los cambios. No se agregan restricciones {xor} sin respaldo.

La presencia de instalaciones y peligros se expresa en las asociaciones. Debe precisarse si los indicadores de existencia del documento reflejan un inventario completo o información todavía parcial; no se declaran como atributos derivados sin esa regla. Tampoco se presupone una jerarquía de elementos ni estados como subclases.

El modelo conceptual omite identificadores técnicos, claves foráneas y detalles de autenticación o almacenamiento. La versión anterior `entidades_modelos.drawio` conserva la vista de datos del documento.

## Generación y verificación

`generar_modelo_dominio.py --output RUTA.drawio` utiliza la API de autoría de CLI-Anything draw.io. Comprueba ocho conceptos, dos tipos de valor, once asociaciones, tres agregaciones, multiplicidades en ambos extremos e integridad de referencias. Verifica también que no se hayan introducido identificadores de persistencia como atributos del modelo conceptual.
