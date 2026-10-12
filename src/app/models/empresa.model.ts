export interface empresaResponse{
    id:number,
    nombreLegal:string,
    responsable:string,
    registroFiscal:string,
    direccion:string,
    registroPatronal:string,
    logoPath:string
}

export interface empresaRequest{
    nombreLegal:string,
    responsable:string,
    registroFiscal:string,
    direccion:string,
    registroPatronal:string,
    logoPath:string
}

export interface empresaPatch{
    id:number,
    direccion:string,
    registroPatronal:string,
    logoPath:string
}