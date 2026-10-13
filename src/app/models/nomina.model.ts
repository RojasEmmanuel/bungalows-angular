
export interface PercepcionRequest {
  concepto: string;
  monto: number;
}

export interface DeduccionRequest {
  tipo: string;
  monto: number;
}

export interface NominaRequest {
  laboralId: number;
  fechaInicio: string;
  fechaFin: string;
  diasPago: number;
  percepciones: PercepcionRequest[];
  deducciones: DeduccionRequest[];
}