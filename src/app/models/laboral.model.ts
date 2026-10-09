export interface LaboralPatch{
    colaboradorId:number,
    fechaIngreso:string,
    sueldo:number,
    turno:string,
    diaDescanso:string,
    entrada:string,
    salida:string,
    estatus:string,
    idPuesto:number,
    idUbicacion:number
}

export interface LaboralResponse{
    antiguedad:number,
    fechaIngreso:string,
    sueldo:number,
    turno:string,
    diaDescanso:string,
    entrada:string,
    salida:string,
    estatus:string,
    puesto:string,
    ubicacion:string
}

export interface AntiguedadesProximas {
  id: number;
  nombreColaborador: string;
  fotografia: string | null;
  puesto:string,
  ubicacion:string,
  diasFaltantes: number;
  antiguedadProxima: number;
  fechaIngreso: string;   // "2021-03-12"
  diasVacaciones: number;
}

export interface Aniversarios{
    id:number,
    nombreColaborador:string,
    puesto:string,
    ubicacion:string,
    fotografia:string,
    fechaIngreso:string,
    diasVacaciones:number,
    antiguedad:number
}