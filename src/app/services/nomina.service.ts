// services/nomina.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NominaRequest } from '../models/nomina.model'; 

@Injectable({ providedIn: 'root' })
export class NominaService {
  private http = inject(HttpClient);
  private baseUrl = '/api/nominas';

  crearNomina(request: NominaRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request);
  }
}