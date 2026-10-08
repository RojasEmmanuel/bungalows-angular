export interface ContactoResponse{
    id:number,
    contacto:string,
    tipo:string
}

export interface ContactoPatch{
    id:number,
    tipoContacto:string,
    contacto:string
}

export interface ContactoRequest{
    colaboradorId:number
    tipoContacto:string,
    contacto:string,
}