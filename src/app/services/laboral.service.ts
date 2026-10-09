import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AntiguedadesProximas, LaboralPatch, LaboralResponse, Aniversarios } from '../models/laboral.model';

@Injectable({ providedIn: 'root' })
export class LaboralService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/laboral';

  getAntiguedadesProximas(): Observable<AntiguedadesProximas[]> {
    return this.http.get<AntiguedadesProximas[]>(`${this.baseUrl}/antiguedades`);
  }

  actualizarLaboral(laboral: LaboralPatch): Observable<LaboralResponse> {
    return this.http.patch<LaboralResponse>(this.baseUrl, laboral);
  }

  getLaboralByColaboradorId(colaboradorId: number): Observable<LaboralResponse> {
    return this.http.get<LaboralResponse>(`${this.baseUrl}/${colaboradorId}`);
  }

  getAniversarios(): Observable<Aniversarios[]>{
    return this.http.get<Aniversarios[]>(`${this.baseUrl}/aniversarios`);
  }

}