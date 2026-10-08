import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnumOption } from '../models/enum-option.model';

@Injectable({ providedIn: 'root' })
export class EnumsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/enums';

  getEstados(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/estados`);
  }

  getEstadosCivil(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/estados-civil`);
  }

  getTurnos(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/turnos`);
  }

  getDiasLaborales(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/dias-laborales`);
  }

  getEstatusColaborador(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/estatus-colaborador`);
  }

  getTiposContacto(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.baseUrl}/tipos-contacto`);
  }
}