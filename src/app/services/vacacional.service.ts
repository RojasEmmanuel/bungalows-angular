import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VacacionalResponse,
} from '../models/vacaciones.model';

@Injectable({ providedIn: 'root' })
export class VacacionalService{

    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/periodos-vacacionales';

    getVacaciones(): Observable<VacacionalResponse[]> {
        return this.http.get<VacacionalResponse[]>(this.baseUrl);
      }
    
}