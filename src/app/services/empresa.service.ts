import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { 
    empresaResponse, empresaPatch, empresaRequest 
} from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class empresaService{
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/empresas';


    getEmpresas():Observable<empresaResponse[]>{
        return this.http.get<empresaResponse[]>(this.baseUrl);
    } 

    crearEmpresa(body: empresaRequest):Observable<void>{
        return this.http.post<void>(this.baseUrl, body);
    }
}