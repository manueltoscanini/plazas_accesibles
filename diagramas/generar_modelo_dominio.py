"""Modelo de dominio UML según la guía de Programación 4 aportada.

Reutiliza la API de autoría de CLI-Anything draw.io del generador anterior.
Las multiplicidades, roles y agregaciones son elementos editables del mxGraph.
"""

from pathlib import Path
from xml.etree import ElementTree as ET
import argparse
import html
import json

from generar_diagrama import load_authoring


# Acá armo el dibujo de los conceptos y las relaciones. Al final reviso que estén todas las partes.
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    api = load_authoring()
    doc = api.create_blank_diagram(2200, 1820)
    api.rename_page(doc, 0, 'Modelo de dominio')
    api.get_model(doc).set('background', '#ffffff')
    doc.set('modified', '2026-11-05')
    doc.set('type', 'device')
    ink = '#172d42'
    blue = '#285d85'
    muted = '#52677b'
    geometries = {}

    def shape(cid, x, y, w, h, label, style, parent='1'):
        api.add_vertex(doc, style, x, y, w, h, label, parent=parent, cell_id=cid)
        return api.find_cell_by_id(doc, cid)

    def text(cid, x, y, w, h, label, size=17, bold=False, color=ink):
        return shape(cid, x, y, w, h, label,
            'text;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;'
            f'fontFamily=Helvetica;fontSize={size};fontStyle={int(bold)};'
            f'fontColor={color};spacing=0;overflow=hidden;')

    def concept(cid, title, x, y, w, h, attributes, datatype=False):
        label = ('&laquo;datatype&raquo;<br/>' if datatype else '') + title
        header = 62 if datatype else 44
        cell = shape(cid, x, y, w, h, label,
            f'swimlane;html=1;startSize={header};horizontal=1;rounded=0;'
            'fillColor=#eaf2f8;swimlaneFillColor=#ffffff;strokeColor=#285d85;'
            'strokeWidth=1.7;fontColor=#172d42;fontSize=21;fontStyle=1;'
            'fontFamily=Helvetica;align=center;spacing=0;collapsible=0;'
            'recursiveResize=0;container=1;')
        cell.set('domainKind', 'datatype' if datatype else 'concept')
        cell.set('domainName', title)
        rows = ''.join(f'<div style="line-height:28px;white-space:nowrap;">{html.escape(a)}</div>'
                       for a in attributes)
        if attributes:
            shape(cid+'-attributes', 16, header+12, w-32, h-header-20, rows,
                'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
                'fontFamily=Helvetica;fontSize=17;fontColor=#172d42;'
                'spacing=0;overflow=hidden;', parent=cid)
        geometries[cid] = (x, y, w, h)

    def note(cid, x, y, w, h, title, body):
        shape(cid, x, y, w, h, '<b>'+title+'</b><br/><br/>'+body,
            'rounded=0;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
            'fillColor=#f4f7fa;strokeColor=#d5e0e9;spacing=16;'
            'fontFamily=Helvetica;fontSize=16;fontColor=#172d42;')

    def endpoint(edge_id, cid, value, position, distance=20):
        cell = ET.SubElement(api.get_root(doc), 'mxCell', {
            'id':cid, 'value':value, 'vertex':'1', 'connectable':'0',
            'parent':edge_id,
            'style':'edgeLabel;html=1;align=center;verticalAlign=middle;'
                    'resizable=0;fontFamily=Helvetica;fontSize=15;'
                    'fontColor=#172d42;labelBackgroundColor=#ffffff;'
        })
        geo = ET.SubElement(cell, 'mxGeometry', {
            'x':str(position), 'y':str(distance), 'relative':'1', 'as':'geometry',
        })
        ET.SubElement(geo, 'mxPoint', {'x':'0', 'y':'0', 'as':'offset'})

    def association(cid, source, target, name, source_mult, target_mult,
                    exitxy, entryxy, aggregate=False, points=None):
        style = (
            'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;'
            f'startArrow={"diamondThin" if aggregate else "none"};'
            'startFill=0;endArrow=none;startSize=20;'
            'strokeColor=#285d85;strokeWidth=1.7;'
            'fontFamily=Helvetica;fontSize=17;fontColor=#172d42;'
            'labelBackgroundColor=#ffffff;'
            f'exitX={exitxy[0]};exitY={exitxy[1]};exitDx=0;exitDy=0;'
            f'entryX={entryxy[0]};entryY={entryxy[1]};entryDx=0;entryDy=0;'
        )
        api.add_edge(doc, source, target, style, name, edge_id=cid)
        edge = api.find_cell_by_id(doc, cid)
        edge.set('domainKind', 'aggregation' if aggregate else 'association')
        edge.set('sourceMultiplicity', source_mult)
        edge.set('targetMultiplicity', target_mult)
        if points:
            arr = ET.SubElement(edge.find('mxGeometry'), 'Array', {'as':'points'})
            for x, y in points:
                ET.SubElement(arr, 'mxPoint', {'x':str(x), 'y':str(y)})
        endpoint(cid, cid+'-source-mult', source_mult, -.80)
        endpoint(cid, cid+'-target-mult', target_mult, .80)

    text('kicker', 60, 30, 2080, 25, 'LABORATORIO 2 .NET  /  ANÁLISIS DEL DOMINIO', 15, True, blue)
    text('title', 60, 72, 2080, 48, 'Modelo de dominio · Plazas y accesibilidad', 34, True)
    text('intro', 60, 135, 2080, 60,
         'Los usuarios consultan la accesibilidad de las plazas y proponen actualizaciones mediante reportes. '
         'Otros usuarios los confirman o refutan; quienes tienen permisos de revisión pueden aprobarlos o rechazarlos.', 18)

    concept('plaza', 'Plaza', 830, 250, 500, 290, [
        'nombre : Texto', 'descripción : Texto',
        'descripciónAccesibilidad : Texto', 'ubicación : Coordenada',
        'fotografías : Imagen [0..*]', 'últimaActualización : FechaHora',
    ])
    concept('bano', 'Baño', 60, 240, 360, 200, [
        'descripción : Texto', 'accesible : Booleano',
        'ubicación : Coordenada', 'fotografía : Imagen',
    ])
    concept('juegos', 'ZonaDeJuegos', 60, 530, 360, 200, [
        'descripción : Texto', 'accesible : Booleano',
        'ubicación : Coordenada', 'fotografía : Imagen',
    ])
    concept('rampa', 'Rampa', 1680, 240, 460, 175, [
        'descripción : Texto', 'ubicación : Coordenada', 'fotografía : Imagen',
    ])
    concept('peligro', 'Peligro', 1680, 530, 460, 175, [
        'descripción : Texto', 'ubicación : Coordenada', 'fotografía : Imagen',
    ])
    concept('senderos', 'DescripciónDeSenderos', 830, 690, 500, 175, [
        'existen : Booleano', 'accesibles : Booleano', 'descripción : Texto',
    ])
    concept('coordenada', 'Coordenada', 60, 800, 360, 145, [
        'latitud : Real', 'longitud : Real',
    ], datatype=True)
    concept('usuario', 'Usuario', 60, 1050, 420, 330, [
        'nombre : Texto', 'apellido : Texto',
        'correo : Texto {único}', 'habilitado : Booleano',
    ])
    concept('reporte', 'Reporte', 1180, 1050, 510, 330, [
        'propuesta : PropuestaDeCambios',
    ])
    concept('propuesta', 'PropuestaDeCambios', 1740, 800, 400, 90, [], datatype=True)

    association('plaza-banos', 'plaza', 'bano', 'dispone de', '1', '0..*',
                (0, .25), (1, .4125), aggregate=True)
    association('plaza-juegos', 'plaza', 'juegos', 'dispone de', '1', '0..*',
                (0, .75), (1, .50), aggregate=True, points=[(620, 467.5), (620, 630)])
    association('plaza-rampas', 'plaza', 'rampa', 'dispone de', '1', '0..*',
                (1, .25), (0, .47143), aggregate=True)
    association('plaza-peligros', 'plaza', 'peligro', 'presenta', '1', '0..*',
                (1, .75), (0, .57143), points=[(1540, 467.5), (1540, 630)])
    association('plaza-senderos', 'plaza', 'senderos', 'tiene información de senderos', '1', '0..1',
                (.5, 1), (.5, 0))
    association('plaza-reportes', 'plaza', 'reporte', 'es objeto de', '1', '0..*',
                (.9, 1), (.5, 0), points=[(1280, 610), (1450, 610), (1450, 980), (1435, 980)])

    role_relations = [
        ('autoria', 'crea', 'autor 1', 'reportes 0..*', 1110),
        ('confirmacion', 'confirma', 'confirmadores 0..*', 'confirmados 0..*', 1165),
        ('refutacion', 'refuta', 'refutadores 0..*', 'refutados 0..*', 1220),
        ('aprobacion', 'aprueba directamente', 'aprobador 0..1', 'aprobados 0..*', 1275),
        ('rechazo', 'rechaza directamente', 'revisor 0..1', 'rechazados 0..*', 1330),
    ]
    for cid, name, src, dst, ypos in role_relations:
        pos = (ypos-1050)/330
        association(cid, 'usuario', 'reporte', name, src, dst, (1, pos), (0, pos))

    note('type-guide', 1740, 925, 400, 455,
         'Tipos y lectura del modelo',
         '<b>Coordenada</b> es un valor de latitud y longitud; '
         'se usa para ubicar plazas y elementos.<br/><br/>'
         '<b>PropuestaDeCambios</b> describe actualizaciones de la plaza y altas, '
         'modificaciones o bajas de sus elementos. Su estructura está pendiente de especificar.<br/><br/>'
         '<b>Imagen</b> representa el valor de una fotografía.<br/><br/>'
         'Los nombres junto a las multiplicidades indican los roles de los extremos.')
    note('intro-senderos', 470, 755, 300, 210,
         'Descripción de un conjunto',
         'DescripciónDeSenderos resume los senderos de una plaza. '
         'El documento no describe caminos individuales.')
    note('legend', 60, 1450, 640, 270,
         'Notación de la presentación',
         '<b>Rectángulo:</b> concepto con atributos.<br/>'
         '<b>«datatype»:</b> tipo de valor, sin identidad propia.<br/>'
         '<b>Rombo vacío en Plaza:</b> agregación compartida.<br/>'
         '<b>1 / 0..1 / 0..*:</b> exactamente uno / opcional / varios.<br/><br/>'
         'La multiplicidad en un extremo cuenta instancias de ese extremo por cada instancia del extremo opuesto.')
    note('constraints', 730, 1450, 670, 270,
         'Restricciones respaldadas por el documento',
         '<b>R1.</b> El correo es único entre usuarios.<br/><br/>'
         '<b>R2.</b> La aprobación o el rechazo directo lo realiza un usuario de confianza '
         'o administrador; son roles de Usuario.<br/><br/>'
         '<b>R3.</b> Confirmar y refutar son relaciones distintas de la decisión directa. '
         'La aprobación automática depende de confirmaciones; no se especifica el umbral.')
    note('assumptions', 1430, 1450, 710, 270,
         'Decisiones y puntos pendientes',
         '<b>Decisiones:</b> cada elemento pertenece a una plaza; cada reporte tiene un autor '
         'y trata una plaza. Una decisión directa puede estar ausente.<br/><br/>'
         'Los peligros se representan con un solo concepto. La duplicación del documento '
         'es una cuestión de almacenamiento.<br/><br/>'
         '<b>Pendiente:</b> exclusión de votos o decisiones, coherencia de indicadores de existencia '
         'y estructura de la propuesta. No se presupone borrado en cascada.')
    src = text('sources', 60, 1750, 2080, 28,
         'Fuentes: Documento modelos · Programación 4: Análisis — Modelado del Dominio '
         '(atributos, roles, multiplicidades y agregación; diapositiva 37) · 05/11/2026', 14, color=muted)
    src.set('link', 'https://docs.google.com/presentation/d/1Acru56Sumv7mjbZv2AY98f3H0_-4BwZI/edit?slide=id.p37#slide=id.p37')

    output = Path(args.output)
    api.write_drawio(doc, str(output))
    checked = ET.parse(output).getroot()
    cells = list(checked.iter('mxCell'))
    ids = {c.get('id') for c in cells}
    assert len(ids) == len(cells), 'IDs repetidos'
    concepts = [c for c in cells if c.get('domainKind') == 'concept']
    datatypes = [c for c in cells if c.get('domainKind') == 'datatype']
    edges = [c for c in cells if c.get('edge') == '1']
    assert len(concepts) == 8 and len(datatypes) == 2 and len(edges) == 11
    assert sum(c.get('domainKind') == 'aggregation' for c in edges) == 3
    for e in edges:
        assert e.get('source') in ids and e.get('target') in ids
        assert e.get('sourceMultiplicity') and e.get('targetMultiplicity')
        assert api.find_cell_by_id(checked, e.get('id')+'-source-mult') is not None
        assert api.find_cell_by_id(checked, e.get('id')+'-target-mult') is not None
    all_labels = '\n'.join(c.get('value', '') for c in cells)
    for forbidden in ['ObjectId', '_id', 'publicSquareId', 'userId', '[REF]', '[ID]']:
        assert forbidden not in all_labels, forbidden
    print(json.dumps({'output':str(output), 'concepts':len(concepts),
                      'datatypes':len(datatypes), 'associations':len(edges),
                      'aggregations':3, 'validation':'passed'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
