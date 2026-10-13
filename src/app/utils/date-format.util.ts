// utils/date-format.util.ts

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function parseISO(iso: string): Date | null {
  if (!iso) return null;
  // "YYYY-MM-DD" como fecha local, sin desfase por zona horaria
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatearFecha(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  return `${dia} de ${MESES[d.getMonth()]}`;
}

/**
 * "01 de octubre al 12 de octubre del 2026"
 * "28 de diciembre del 2025 al 05 de enero del 2026"
 */
export function formatearPeriodo(inicioISO: string, finISO: string): string {
  const ini = parseISO(inicioISO);
  const fin = parseISO(finISO);
  if (!ini || !fin) return '';

  const anioIni = ini.getFullYear();
  const anioFin = fin.getFullYear();

  if (anioIni === anioFin) {
    return `${formatearFecha(ini)} al ${formatearFecha(fin)} del ${anioFin}`;
  }
  return `${formatearFecha(ini)} del ${anioIni} al ${formatearFecha(fin)} del ${anioFin}`;
}