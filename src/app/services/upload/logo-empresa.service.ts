import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadResponse } from '../../models/upload.model';
import { UploadService } from './upload.service';

@Injectable({ providedIn: 'root' })
export class UploadLogoEmpresaService {
  private readonly upload = inject(UploadService);

  subirDocumento(file: File): Observable<UploadResponse> {
    return this.upload.subir(file, 'empresa/logo');
  }
}