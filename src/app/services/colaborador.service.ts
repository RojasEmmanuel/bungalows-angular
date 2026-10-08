import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ColaboradorTable, 
  ColaboradorRequest, ColaboradorResponse,
  ColaboradorPatch, ColaboradorSimpleResponse
} from '../models/colaborador.model';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/colaboradores';

  getColaboradores(): Observable<ColaboradorTable[]> {
    return this.http.get<ColaboradorTable[]>(`${this.baseUrl}`);
  }

  crearColaborador(body: ColaboradorRequest): Observable<ColaboradorTable> {
    return this.http.post<ColaboradorTable>(`${this.baseUrl}`, body);
  }

  getColaboradorById(id: number): Observable<ColaboradorResponse> {
    return this.http.get<ColaboradorResponse>(`${this.baseUrl}/${id}`);
  }


  getColaboradorSimpleById(id: number): Observable<ColaboradorSimpleResponse> {
    return this.http.get<ColaboradorSimpleResponse>(`${this.baseUrl}/simple/${id}`);
  }
  
  actualizarColaborador(body: ColaboradorPatch): Observable<ColaboradorResponse> {
    return this.http.patch<ColaboradorResponse>(`${this.baseUrl}`, body);
  }
}