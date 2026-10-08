import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadResponse } from '../../models/upload.model';
import { UploadService } from './upload.service';

@Injectable({ providedIn: 'root' })
export class UploadUbicacionService {
  private readonly upload = inject(UploadService);

  subirImagen(file: File): Observable<UploadResponse> {
    return this.upload.subir(file, 'ubicaciones');
  }
}