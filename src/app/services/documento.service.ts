import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoRequest, DocumentoResponse } from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/documentos';

  getDocumentosByColaboradorId(colaboradorId: number): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(`${this.baseUrl}/${colaboradorId}`);
    }

  crearDocumento(body: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.baseUrl, body);
  }

  eliminarDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}