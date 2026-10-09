export interface VacacionesResponse{
    id:number,
    nombreColaborador:string,
    puesto:string,
    ubicacion:string,
    fechaInicio:string,
    fechaFin:string,
    diasOcupados:number,
    estatus:string
}

export interface VacacionesRequest{
    fechaInicio:string,
    fechaFin:string,
    colaboradorId:number,
    estatusVacaciones:string
}


export interface VacacionesPatch{
    id:number,
    fechaInicio:string,
    fechaFin:string,
    estatusVacaciones:string
}

export interface VacacionesSimpleResponse{
    id:number,
    fechaInicio:string,
    fechaFin:string,
}
