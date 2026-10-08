import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PuestoResponse, PuestoRequest } from '../models/puesto.model';

@Injectable({ providedIn: 'root' })
export class PuestoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/puestos';

  getPuestos(): Observable<PuestoResponse[]> {
    return this.http.get<PuestoResponse[]>(this.baseUrl);
  }
  
  crearPuesto(puesto: PuestoRequest): Observable<PuestoResponse> {
    return this.http.post<PuestoResponse>(this.baseUrl, puesto);
  }
}