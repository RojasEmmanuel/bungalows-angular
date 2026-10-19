export interface VacacionesResponse{
    id:number,
    nombreColaborador:string,
    puesto:string,
    ubicacion:string,
    fechaInicio:string,
    fechaFin:string,
    diasOcupados:number,
    fechaRegreso:string,
    cantidadPagada:number | null,
    estatus:string
}

export interface VacacionesRequest{
    fechaInicio:string,
    fechaFin:string,
    colaboradorId:number,
    estatusVacaciones:string,
    cantidadPagada:number | null
}


export interface VacacionesPatch{
    id:number,
    fechaInicio:string,
    fechaFin:string,
    estatusVacaciones:string,
    cantidadPagada:number | null,
}

export interface VacacionesSimpleResponse{
    id:number,
    fechaInicio:string,
    fechaFin:string,
    estatusVacaciones:string,
    cantidadPagada:number | null,
}


export interface VacacionalResponse{
    id:number,
    colaboradorNombre:string,
    colaboradorPuesto:string,
    colaboradorUbicacion:string,
    antiguedad:number,
    diasVacaciones:number,
    diasOcupados:number,
    diasDisponibles:number,
}