export interface empresaResponse {
  id: number;
  nombreLegal: string;
  responsable: string;
  regimenFiscal: string;
  direccion: string | null;
  registroPatronal: string | null;
  rfc:string| null;
  logoPath: string | null;
}

export interface empresaRequest {
  nombreLegal: string;
  responsable: string;
  regimenFiscal: string;
  rfc:string | null;
  direccion: string | null;
  registroPatronal: string | null;
  logoPath: string | null;
}

export interface empresaPatch {
  id: number;
  rfc:string | null;
  direccion?: string | null;
  registroPatronal?: string | null;
  logoPath?: string | null;
}