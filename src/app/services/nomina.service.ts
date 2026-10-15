// services/nomina.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NominaRequest } from '../models/nomina.model'; 

@Injectable({ providedIn: 'root' })
export class NominaService {
  private http = inject(HttpClient);
  private baseUrl = '/api/nominas';

  /** El backend devuelve solo el id de la nómina creada */
  crearNomina(request: NominaRequest): Observable<number> {
    return this.http.post<number>(this.baseUrl, request);
  }

  /** Descarga el PDF de una nómina como Blob */
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
  }
}