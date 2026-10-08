//interface de la tabla prestamos
export interface PrestamoResponse {
    id:number,
    nombreColaborador:string,
    puestoColaborador:string,
    ubicacionColaborador:string,
    monto:number,
    fechaPrestamo:string,
    fechaPago:string,
    estatus:string,
    observaciones:string
}

export interface PrestamoPatch {
    id:number,
    monto:number,
    fechaPrestamo:string,
    estatus:string,
    observaciones:string
}

export interface PrestamoRequest {
    monto:number,
    fechaPrestamo:string,
    observaciones:string,
    colaboradorId:number
}

export interface PrestamoSimpleResponse {
    id:number,
    monto:number,
    fechaPrestamo:string,
    estatus:string,
    observaciones:string
}