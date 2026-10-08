// MODELO PARA LA TABLA DE COLABORADORES
export interface ColaboradorTable {
    id:number;
    nombreCompleto:string;
    edad:number;
    fotografia:string;
    antiguedad:number;
    fechaIngreso:string;
    sueldo:number;
    turno:string;
    diaDescanso:string;
    entrada:string;
    salida:string;
    puesto:string;
    ubicacion:string;
}


// PARA EL FORMULARIO DE CREACIÓN DE COLABORADOR
export interface ColaboradorRequest {
  // Datos personales
  nombre: string;
  ap: string;
  am: string;
  fechaNacimiento: string;
  estadoCivil: string;
  fotografia: string | null;

  // Datos laborales
  fechaIngreso: string;
  sueldo: number;
  turno: string;
  diaDescanso: string;
  entrada: string;
  salida: string;
  estatus: string;            // ← FALTABA
  idPuesto: number;
  idUbicacion: number;

  // Datos confidenciales
  curp: string;
  nss: string;
  rfc: string;

  // Dirección
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string;
}

export interface ColaboradorResponse {
    id: number;
    nombreCompleto: string 
    edad:number,
    fotografia:string,
    antiguedad:number,
    fechaIngreso:string,
    sueldo:number,
    turno:string,
    diaDescanso:string,
    entrada:string,
    salida:string,
    puesto:string,
    ubicacion:string
    curp: string,
    rfc: string,
    nss: string,
    direccion:string
}




export interface ColaboradorSimpleResponse {
    id: number;
    nombre: string;
    ap: string;
    am: string;
    fechaNacimiento: string;
    estadoCivil: string;
    fotografia: string | null;
}


export interface ColaboradorPatch{
    id: number;
    nombre: string;
    ap: string;
    am: string;
    fechaNacimiento: string;
    estadoCivil: string;
    fotografia: string | null;
}
