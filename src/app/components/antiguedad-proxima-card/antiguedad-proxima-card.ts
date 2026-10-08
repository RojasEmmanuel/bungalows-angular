import { Component, input } from '@angular/core';
import { AntiguedadesProximas } from '../../models/laboral.model';

@Component({
  selector: 'app-antiguedad-proxima-card',
  standalone: true,
  templateUrl: './antiguedad-proxima-card.html',
  styleUrl: './antiguedad-proxima-card.css',
})
export class AntiguedadProximaCardComponent {
  antiguedad = input.required<AntiguedadesProximas>();
}