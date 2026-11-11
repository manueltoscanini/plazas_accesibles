"""Crea el DER con las funciones de autoría de CLI-Anything para draw.io.

El módulo de autoría instalado importa defusedxml incluso al crear archivos.
En este equipo no está esa dependencia. Se cargan sus funciones de creación
sin el import ni la función de lectura de XML externo; no se sustituye el parser.
No se modifica la instalación del harness.
"""

from pathlib import Path
from xml.etree import ElementTree as ET
import argparse
import ast
import html
import json
import types

HARNESS = Path.home() / '.codex/.tmp/marketplaces/cli-anything/drawio/agent-harness'
AUTHORING = HARNESS / 'cli_anything/drawio/utils/drawio_xml.py'
SOURCE_URL = 'https://docs.google.com/document/d/15zNIaKjulXEgN9O7NYvCQa2mFl9X1IDOeQhBfVDFpvY/edit'


# Acá cargo la herramienta que me deja armar el archivo de draw.io.
def load_authoring():
    tree = ast.parse(AUTHORING.read_text(encoding='utf-8'), filename=str(AUTHORING))
    tree.body = [node for node in tree.body if not (
        isinstance(node, ast.ImportFrom) and node.module == 'defusedxml.ElementTree'
        or isinstance(node, ast.FunctionDef) and node.name == 'parse_drawio'
    )]
    module = types.ModuleType('cli_anything_drawio_authoring')
    exec(compile(tree, str(AUTHORING), 'exec'), module.__dict__)
    return module


# Acá dibujo las entidades y reviso que el archivo final haya quedado bien armado.
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    api = load_authoring()
    root = api.create_blank_diagram(1700, 1260)
    root.set('modified', '2026-11-05')
    root.set('type', 'device')
    api.rename_page(root, 0, '01 Entidades y relaciones')
    api.add_page(root, '02 Reportes y usuarios', 1700, 1260)
    for page in root.findall('diagram'):
        page.find('mxGraphModel').set('background', '#ffffff')

    ink = '#172d42'
    muted = '#52677b'
    blue = '#225e91'
    teal = '#187666'
    purple = '#6f4a8f'

    def add(page, cid, x, y, w, h, label, style, parent='1'):
        api.add_vertex(root, style, x, y, w, h, label,
                       parent=parent, diagram_index=page, cell_id=cid)
        return api.find_cell_by_id(root, cid, page)

    def text(page, cid, x, y, w, h, label, size=16, color=muted, bold=False):
        return add(page, cid, x, y, w, h, label,
            f'text;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;'
            f'fontFamily=Helvetica;fontSize={size};fontColor={color};'
            f'fontStyle={1 if bold else 0};spacing=0;overflow=hidden;')

    def heading(page, title, subtitle):
        text(page, f'p{page}-kicker', 60, 28, 1580, 24,
             'LABORATORIO 2 .NET  /  MODELO DE DATOS', 14, blue, True)
        text(page, f'p{page}-title', 60, 65, 1580, 48, title, 32, ink, True)
        text(page, f'p{page}-subtitle', 60, 122, 1580, 30, subtitle, 16)

    def entity(page, name, x, y, w, h, rows, color, size=15, cid=None):
        cid = cid or name
        cell = add(page, cid, x, y, w, h, name,
            f'swimlane;html=1;startSize=44;horizontal=1;rounded=0;'
            f'fillColor={color};swimlaneFillColor=#ffffff;strokeColor={color};'
            f'strokeWidth=1.7;fontColor=#ffffff;fontSize=20;fontStyle=1;'
            f'fontFamily=Helvetica;align=left;spacingLeft=16;collapsible=0;'
            f'recursiveResize=0;container=1;')
        body = ''.join(
            f'<div style="line-height:23px;white-space:nowrap;">{html.escape(row)}</div>'
            for row in rows
        )
        add(page, cid+'-attributes', 14, 54, w-28, h-64, body,
            f'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
            f'fontFamily=Helvetica;fontSize={size};fontColor={ink};'
            'spacing=0;overflow=hidden;', parent=cid)
        cell.set('entity', name)
        return cid

    def note(page, cid, x, y, w, h, title, content):
        add(page, cid, x, y, w, h,
            f'<b>{html.escape(title)}</b><br/><br/>{content}',
            'rounded=0;html=1;whiteSpace=wrap;align=left;verticalAlign=top;'
            'fillColor=#f2f6f9;strokeColor=#d7e1e9;spacing=16;'
            f'fontFamily=Helvetica;fontSize=15;fontColor={ink};')

    def edge(page, cid, source, target, label, exitxy, entryxy,
             start='ERone', end='ERzeroToMany', color=blue, points=None):
        style = (
            f'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;'
            f'startArrow={start};endArrow={end};startSize=16;endSize=16;'
            f'strokeWidth=1.8;strokeColor={color};fontColor={ink};'
            'fontFamily=Helvetica;fontSize=15;labelBackgroundColor=#ffffff;'
            f'exitX={exitxy[0]};exitY={exitxy[1]};exitDx=0;exitDy=0;'
            f'entryX={entryxy[0]};entryY={entryxy[1]};entryDx=0;entryDy=0;'
        )
        api.add_edge(root, source, target, style, label,
                     diagram_index=page, edge_id=cid)
        cell = api.find_cell_by_id(root, cid, page)
        if points:
            arr = ET.SubElement(cell.find('mxGeometry'), 'Array', {'as':'points'})
            for x, y in points:
                ET.SubElement(arr, 'mxPoint', {'x':str(x), 'y':str(y)})
        return cell

    user_rows = [
        '[ID] _id: ObjectId', 'firstName: String', 'lastName: String',
        'email: String [único, indexado]', 'password: String',
        'createdAt: Date', 'enabled: Boolean',
    ]
    facility_rows = [
        '[ID] _id: ObjectId', '[REF] publicSquareId: ObjectId',
        'description: String', 'picture: String',
        'accessible: Boolean', 'lat: Double', 'lon: Double',
    ]
    square_rows = [
        '[ID] _id: ObjectId', 'name: String', 'description: String',
        'accessibilityDescription: String',
        'location: {lat: Double, lon: Double}',
        'wc: {exists: Boolean}', 'playground: {exists: Boolean}',
        'ramps: {exists: Boolean}',
        'paths: {exists: Boolean,',
        '  accessible: Boolean, description: String}',
        'hazards: {exists: Boolean,',
        '  hazards: [{description: String, lat: Double,',
        '    lon: Double, picture: String}]}',
        'pictures: [String]', 'createdAt: Date', 'updatedAt: Date',
    ]
    report_rows = [
        '[ID] _id: ObjectId', '[REF] publicSquareId: ObjectId → PublicSquare',
        '[REF] userId: ObjectId → User', 'changes: Object',
        'addWC: Object', 'addPlayground: Object', 'addRamp: Object',
        'addHazard: Object', 'modifyWC: Object', 'modifyPlayground: Object',
        'modifyRamp: Object', 'modifyHazard: Object', 'deleteWC: Object',
        'deletePlayground: Object', 'deleteRamp: Object', 'deleteHazard: Object',
        '[REF] autoApprovedBy: [ObjectId → User]',
        '[REF] autoRejectedBy: [ObjectId → User]',
        '[REF] approvedBy: ObjectId → User',
        '[REF] rejectedBy: ObjectId → User',
    ]

    heading(0, 'Entidades y relaciones',
            'Siete entidades del documento Modelos · referencias ObjectId y atributos originales')
    entity(0, 'PublicSquare', 640, 190, 430, 450, square_rows, blue, 14)
    entity(0, 'PublicSquareWC', 60, 190, 360, 240, facility_rows, teal, 14)
    entity(0, 'PublicSquarePlayground', 60, 510, 360, 240, facility_rows, teal, 14)
    entity(0, 'PublicSquareRamp', 1280, 190, 360, 220,
           [r for r in facility_rows if r != 'accessible: Boolean'], teal, 14)
    entity(0, 'PublicSquareHazard', 1280, 510, 360, 220,
           [r for r in facility_rows if r != 'accessible: Boolean'], teal, 14)
    entity(0, 'User', 60, 860, 360, 240, user_rows, purple, 14)
    entity(0, 'Report', 640, 830, 430, 270, [
        '[ID] _id: ObjectId', '[REF] publicSquareId: ObjectId',
        '[REF] userId: ObjectId', 'changes y operaciones: Object',
        'autoApprovedBy / autoRejectedBy: [ObjectId]',
        'approvedBy / rejectedBy: ObjectId',
        'Detalle completo y vínculos con User: pág. 2',
    ], purple, 14)
    edge(0, 'square-wc', 'PublicSquare', 'PublicSquareWC',
         'contiene baños<br/>1 ↔ 0..*', (0, .20), (1, .40))
    edge(0, 'square-playground', 'PublicSquare', 'PublicSquarePlayground',
         'contiene juegos<br/>1 ↔ 0..*', (0, .80), (1, .40))
    edge(0, 'square-ramp', 'PublicSquare', 'PublicSquareRamp',
         'contiene rampas<br/>1 ↔ 0..*', (1, .20), (0, .44))
    edge(0, 'square-hazard', 'PublicSquare', 'PublicSquareHazard',
         'registra peligros<br/>1 ↔ 0..*', (1, .80), (0, .44))
    edge(0, 'square-report', 'PublicSquare', 'Report',
         'recibe reportes · publicSquareId<br/>1 ↔ 0..*', (.5, 1), (.5, 0))
    edge(0, 'user-author', 'User', 'Report',
         'crea · userId<br/>1 ↔ 0..*', (1, .50), (0, .55556), color=purple)
    note(0, 'hazard-ambiguity', 1130, 830, 510, 270,
         'Dos representaciones de peligros',
         'El documento declara <b>hazards.hazards</b> embebido en PublicSquare '
         'y también la entidad <b>PublicSquareHazard</b>.<br/><br/>'
         'Se conservan ambas. El texto no define cuál es la fuente de verdad '
         'ni cómo se sincronizan.<br/><br/>'
         'location, paths y los demás objetos embebidos no son entidades independientes.')
    text(0, 'legend', 60, 1140, 1580, 30,
         '<b>Leyenda:</b> [ID] identificador · [REF] referencia ObjectId · '
         '1 = uno · 0..1 = opcional · 0..* = cero o muchos · [ ] = arreglo', 15)
    text(0, 'assumption', 60, 1180, 1580, 30,
         'Supuesto de lectura: cada entidad hija y cada reporte refieren a una plaza; '
         'una plaza puede tener cero o más elementos y reportes.', 15)

    heading(1, 'Reportes y usuarios',
            'Cinco relaciones distintas con User · cada línea identifica el campo que almacena la referencia')
    entity(1, 'User', 60, 220, 390, 600, user_rows, purple, 16, 'detail-user')
    entity(1, 'Report', 1000, 190, 640, 660, report_rows, purple, 16, 'detail-report')
    relations = [
        ('userId', 'crea', '1 ↔ 0..*', 'ERone', 315),
        ('approvedBy', 'aprueba directamente', '0..1 ↔ 0..*', 'ERzeroToOne', 420),
        ('rejectedBy', 'rechaza directamente', '0..1 ↔ 0..*', 'ERzeroToOne', 525),
        ('autoApprovedBy', 'confirma (voto positivo)', '0..* ↔ 0..*', 'ERzeroToMany', 630),
        ('autoRejectedBy', 'refuta (voto negativo)', '0..* ↔ 0..*', 'ERzeroToMany', 735),
    ]
    for field, verb, cardinality, start, ypos in relations:
        edge(1, 'rel-'+field, 'detail-user', 'detail-report',
             f'{verb} · <b>{field}</b><br/>{cardinality}',
             (1, (ypos-220)/600), (0, (ypos-190)/660), start=start, color=purple)
    note(1, 'user-context', 80, 525, 350, 260,
         'Un usuario, varios roles',
         'El mismo User puede ser autor, votar o realizar una revisión directa.'
         '<br/><br/>El documento menciona administradores y usuarios de confianza, '
         'pero no declara un atributo de rol ni una entidad adicional para ellos.')
    note(1, 'read-cardinalities', 60, 900, 480, 250,
         'Cómo leer las cardinalidades',
         'Los valores se indican de <b>User (izquierda)</b> a <b>Report (derecha)</b>.'
         '<br/><br/>Ejemplo: <b>approvedBy 0..1 ↔ 0..*</b> significa que cada '
         'reporte tiene cero o un aprobador directo y un usuario puede aprobar '
         'cero o muchos reportes.')
    note(1, 'assumptions-detail', 565, 900, 510, 250,
         'Supuestos que no son restricciones declaradas',
         'Se interpreta <b>userId</b> como un autor por reporte; '
         '<b>approvedBy</b> y <b>rejectedBy</b> se muestran opcionales mientras no hay revisión.'
         '<br/><br/>Los arreglos de votos permiten varios usuarios por reporte y varios '
         'reportes por usuario. El texto no define exclusión entre votos, estados '
         'ni validaciones de obligatoriedad.')
    note(1, 'objects-detail', 1100, 900, 540, 250,
         'Objetos de cambios y operaciones',
         '<b>changes</b> y los campos add*, modify* y delete* están tipados como '
         '<b>Object</b>; su estructura interna no está especificada.'
         '<br/><br/>No se agregan referencias directas de Report a WC, Playground, '
         'Ramp o Hazard porque el documento no las declara.')
    source = text(1, 'source', 60, 1180, 1580, 32,
         'Fuente: Documento modelos · carpeta compartida Laboratorio 2 .NET · '
         'consulta: 05/11/2026 · elaborado con CLI-Anything draw.io', 14)
    source.set('link', SOURCE_URL)

    # Validación del archivo que efectivamente se entrega.
    output = Path(args.output)
    api.write_drawio(root, str(output))
    checked = ET.parse(output).getroot()
    assert len(checked.findall('diagram')) == 2
    expected_entities = {'User', 'PublicSquare', 'PublicSquareWC',
                         'PublicSquarePlayground', 'PublicSquareRamp',
                         'PublicSquareHazard', 'Report'}
    assert {c.get('entity') for c in checked.findall('diagram')[0].iter('mxCell')
            if c.get('entity')} == expected_entities
    assert [len(d.findall('.//mxCell[@edge="1"]')) for d in checked] == [6, 5]
    for diagram in checked:
        cells = list(diagram.iter('mxCell'))
        ids = {c.get('id') for c in cells}
        assert len(ids) == len(cells), 'IDs repetidos'
        for c in cells:
            if c.get('edge') == '1':
                assert c.get('source') in ids and c.get('target') in ids
    report_label = ''.join(c.get('value', '') for c in checked.findall('diagram')[1].iter('mxCell'))
    for row in report_rows:
        assert html.escape(row) in report_label, row
    print(json.dumps({'output': str(output), 'entities': len(expected_entities),
                      'pages': 2, 'references': 10, 'validation': 'passed'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
