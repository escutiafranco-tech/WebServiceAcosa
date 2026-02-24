const { readdirSync, readFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const ExcelJS = require('exceljs');

const desktop = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Desktop') : 'C:/Users/Francisco Escutia/Desktop';
const baseFolder = path.join(desktop, 'Chalco 21.11', 'Chalco 21.11');
const outputFolder = path.join(desktop, 'Facturas');
const outputFile = path.join(outputFolder, 'facturas.xlsx');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  allowBooleanAttributes: true,
});

function safeAttr(obj, attr) {
  return obj && obj[attr] !== undefined ? obj[attr] : '';
}

function getIvaFromConcept(concepto) {
  try {
    const impuestos = concepto.Impuestos || concepto.impuestos;
    if (!impuestos) return '';
    const traslados = impuestos.Traslados || impuestos.traslados;
    if (!traslados) return '';
    const traslado = Array.isArray(traslados.Traslado || traslados.traslado) ? (traslados.Traslado || traslados.traslado)[0] : (traslados.Traslado || traslados.traslado);
    if (!traslado) return '';
    const impuesto = safeAttr(traslado, 'Impuesto') || safeAttr(traslado, 'impuesto');
    const tasa = safeAttr(traslado, 'TasaOCuota') || safeAttr(traslado, 'tasaOCuota');
    const importe = safeAttr(traslado, 'Importe') || safeAttr(traslado, 'importe');
    if (impuesto && importe) return importe;
    if (tasa && concepto.Importe) {
      const imp = parseFloat(concepto.Importe);
      const rate = parseFloat(tasa);
      if (!isNaN(imp) && !isNaN(rate)) return (imp * rate).toFixed(6);
    }
    return '';
  } catch {
    return '';
  }
}

function parseInvoice(xmlContent) {
  const json = parser.parse(xmlContent);
  const comprobante = json.Comprobante || json.cfdi_Comprobante || json['cfdi:Comprobante'] || json.comprobante;
  if (!comprobante) return null;

  const emisor = comprobante.Emisor || comprobante['cfdi:Emisor'] || comprobante.emisor;
  const receptor = comprobante.Receptor || comprobante['cfdi:Receptor'] || comprobante.receptor;
  const complemento = comprobante.Complemento || comprobante['cfdi:Complemento'] || comprobante.complemento;
  let uuid = '';
  if (complemento) {
    const timbre = complemento.TimbreFiscalDigital || complemento['tfd:TimbreFiscalDigital'] || complemento.timbreFiscalDigital;
    if (timbre) uuid = safeAttr(timbre, 'UUID') || safeAttr(timbre, 'uuid');
  }

  const conceptosWrap = comprobante.Conceptos || comprobante['cfdi:Conceptos'] || comprobante.conceptos;
  let conceptos = [];
  if (conceptosWrap) {
    conceptos = conceptosWrap.Concepto || conceptosWrap['cfdi:Concepto'] || conceptosWrap.concepto || [];
    if (!Array.isArray(conceptos)) conceptos = [conceptos];
  }

  const resumen = {
    UUID: uuid,
    Serie: safeAttr(comprobante, 'Serie') || safeAttr(comprobante, 'serie'),
    Folio: safeAttr(comprobante, 'Folio') || safeAttr(comprobante, 'folio'),
    Fecha: safeAttr(comprobante, 'Fecha') || safeAttr(comprobante, 'fecha'),
    Hora: (safeAttr(comprobante, 'Fecha') || safeAttr(comprobante, 'fecha') || '').split('T')[1] || '',
    EmisorNombre: safeAttr(emisor, 'Nombre') || safeAttr(emisor, 'nombre'),
    EmisorRFC: safeAttr(emisor, 'Rfc') || safeAttr(emisor, 'RFC') || safeAttr(emisor, 'rfc'),
    ReceptorNombre: safeAttr(receptor, 'Nombre') || safeAttr(receptor, 'nombre'),
    ReceptorRFC: safeAttr(receptor, 'Rfc') || safeAttr(receptor, 'RFC') || safeAttr(receptor, 'rfc'),
    LugarExpedicion: safeAttr(comprobante, 'LugarExpedicion') || safeAttr(comprobante, 'lugarExpedicion') || safeAttr(comprobante, 'LugarExp'),
    UsoCFDI: safeAttr(receptor, 'UsoCFDI') || safeAttr(receptor, 'usoCFDI') || safeAttr(receptor, 'UsoCFDI40') || safeAttr(receptor, 'usoCFDI40'),
    SubTotal: safeAttr(comprobante, 'SubTotal') || safeAttr(comprobante, 'subTotal') || safeAttr(comprobante, 'Subtotal') || safeAttr(comprobante, 'subtotal'),
    Total: safeAttr(comprobante, 'Total') || safeAttr(comprobante, 'total'),
    Moneda: safeAttr(comprobante, 'Moneda') || safeAttr(comprobante, 'moneda'),
    TipoCambio: safeAttr(comprobante, 'TipoCambio') || safeAttr(comprobante, 'tipoCambio'),
    MetodoPago: safeAttr(comprobante, 'MetodoPago') || safeAttr(comprobante, 'metodoPago'),
    FormaPago: safeAttr(comprobante, 'FormaPago') || safeAttr(comprobante, 'formaPago'),
  };

  const partidas = conceptos.map((c) => ({
    UUID: uuid,
    Cantidad: safeAttr(c, 'Cantidad') || safeAttr(c, 'cantidad'),
    Descripcion: safeAttr(c, 'Descripcion') || safeAttr(c, 'descripcion'),
    Unidad: safeAttr(c, 'Unidad') || safeAttr(c, 'unidad'),
    PrecioUnitario: safeAttr(c, 'ValorUnitario') || safeAttr(c, 'valorUnitario'),
    Importe: safeAttr(c, 'Importe') || safeAttr(c, 'importe'),
    IVA: getIvaFromConcept(c),
  }));

  return { resumen, partidas };
}

async function main() {
  const files = readdirSync(baseFolder).filter(f => f.toLowerCase().endsWith('.xml'));
  const workbook = new ExcelJS.Workbook();
  // Asegurar carpeta de salida
  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder, { recursive: true });
  }

  const wsResumen = workbook.addWorksheet('Resumen');
  wsResumen.columns = [
    { header: 'UUID', key: 'UUID', width: 40 },
    { header: 'Serie', key: 'Serie', width: 10 },
    { header: 'Folio', key: 'Folio', width: 12 },
    { header: 'Fecha', key: 'Fecha', width: 22 },
    { header: 'Hora', key: 'Hora', width: 10 },
    { header: 'EmisorNombre', key: 'EmisorNombre', width: 40 },
    { header: 'EmisorRFC', key: 'EmisorRFC', width: 16 },
    { header: 'ReceptorNombre', key: 'ReceptorNombre', width: 40 },
    { header: 'ReceptorRFC', key: 'ReceptorRFC', width: 16 },
    { header: 'LugarExpedicion', key: 'LugarExpedicion', width: 16 },
    { header: 'UsoCFDI', key: 'UsoCFDI', width: 12 },
    { header: 'SubTotal', key: 'SubTotal', width: 16 },
    { header: 'Total', key: 'Total', width: 16 },
    { header: 'Moneda', key: 'Moneda', width: 10 },
    { header: 'TipoCambio', key: 'TipoCambio', width: 12 },
    { header: 'MetodoPago', key: 'MetodoPago', width: 12 },
    { header: 'FormaPago', key: 'FormaPago', width: 12 }
  ];

  const wsPartidas = workbook.addWorksheet('Partidas');
  wsPartidas.columns = [
    { header: 'UUID', key: 'UUID', width: 40 },
    { header: 'Cant', key: 'Cantidad', width: 10 },
    { header: 'Descripción', key: 'Descripcion', width: 50 },
    { header: 'Unidad', key: 'Unidad', width: 12 },
    { header: 'Precio Unitario', key: 'PrecioUnitario', width: 16 },
    { header: 'Importe', key: 'Importe', width: 16 },
    { header: 'IVA', key: 'IVA', width: 16 }
  ];

  for (const file of files) {
    const full = path.join(baseFolder, file);
    try {
      const xml = readFileSync(full, 'utf8');
      const parsed = parseInvoice(xml);
      if (!parsed) continue;
      wsResumen.addRow(parsed.resumen);
      parsed.partidas.forEach(p => wsPartidas.addRow(p));
    } catch (err) {
      console.error('Error procesando', full, err?.message || err);
    }
  }

  await workbook.xlsx.writeFile(outputFile);
  console.log('Excel generado en:', outputFile);
}

main().catch(e => {
  console.error('Error general:', e);
});
