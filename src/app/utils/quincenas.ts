// utils/quincenas.ts
export type Quincena = 'primera' | 'segunda' | 'anual';

export interface RangoFechas {
  fechaInicio: string; // ISO yyyy-MM-dd
  fechaFin: string;
}

export function rangoQuincena(ejercicio: number, quincena: Quincena, hoy = new Date()): RangoFechas {
  if (quincena === 'anual') {
    return {
      fechaInicio: `${ejercicio}-01-01`,
      fechaFin: `${ejercicio}-12-31`,
    };
  }

  const mes = hoy.getFullYear() === ejercicio ? hoy.getMonth() + 1 : 1;
  const mm = String(mes).padStart(2, '0');
  const ultimoDia = new Date(ejercicio, mes, 0).getDate();

  return quincena === 'primera'
    ? { fechaInicio: `${ejercicio}-${mm}-01`, fechaFin: `${ejercicio}-${mm}-15` }
    : { fechaInicio: `${ejercicio}-${mm}-16`, fechaFin: `${ejercicio}-${mm}-${ultimoDia}` };
}

export function etiquetaQuincena(q: Quincena, ejercicio: number, hoy = new Date()): string {
  if (q === 'anual') return `Todo ${ejercicio}`;
  const mes = hoy.toLocaleDateString('es-MX', { month: 'long' });
  return q === 'primera' ? `Primera quincena de ${mes}` : `Segunda quincena de ${mes}`;
}