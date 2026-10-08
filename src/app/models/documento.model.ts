export interface DocumentoResponse {
    id:number,
    nombre:string,
    path:string
}

export interface DocumentoRequest {
    nombre:string,
    path:string,
    colaboradorId:number
}