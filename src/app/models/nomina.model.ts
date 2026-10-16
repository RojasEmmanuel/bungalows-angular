
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

export interface DeduccionResponse{
  tipo:string;
  monto:number;
}

export interface PercepcionResponse{
  concepto:string;
  monto:number;
}

export interface NominaDetalleResponse{
  id:number;
  nombreColaborador:string;
  ejercicio:number;
  periodo:string;
  diasPago:number;
  subtotal:number;
  descuentos:number;
  retenciones:number;
  total:number;
  percepciones: PercepcionResponse[];
  deducciones: DeduccionResponse[];
}

export interface NominaListadoResponse{
  id:number;
  nombreColaborador:string;
  fotografia:string | null;  
  ejercicio:number;
  fechaInicio:string;
  fechaFin:string;
  fechaPago:string;
  diasPago:number;
  subtotal:number;
  descuentos:number;
  retenciones:number;
  total:number
}


export interface NominaResumenResponse{
  cantidadNominas:number;
  subtotal:number
  descuentos:number;
  retenciones:number;
  total:number;
}


export interface NominaFiltros {
  ejercicio?: number;
  fechaInicio?: string;   // ISO: yyyy-MM-dd
  fechaFin?: string;      // ISO: yyyy-MM-dd
  colaborador?: string;   // solo aplica a /lista
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
