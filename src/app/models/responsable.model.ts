export interface ResponsableResponse{
    id:number,
    nombre:string,
    parentesco:string,
    telefono:string
}

export interface ResponsablePatch{
    id:number,
    nombre:string,
    parentesco:string,
    telefono:string
}

export interface ResponsableRequest{
    nombre:string,
    parentesco:string,
    telefono:string
    colaboradorId:number
}