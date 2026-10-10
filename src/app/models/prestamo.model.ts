export interface PrestamoResponse{
    id:number,
    nombreColaborador:string,
    puestoColaborador:string,
    ubicacionColaborador:string,
    monto:number,
    montoPagado:number,
    fechaPrestamo:string,
    fechaPago:string,
    estatus:string,
    observaciones:string
}


export interface PrestamoRequest{
    monto:number,
    concepto:string,
    fechaPrestamo:string,
    observaciones:string,
    colaboradorId:number
}

export interface DeudaResponse{
    colaboradorId:number,
    colaborador:string,
    fotografia:string,
    puesto:string,
    ubicacion:string,
    prestamosActivos:number,
    prestado:number,
    pagado:number,
    pendiente:number
}