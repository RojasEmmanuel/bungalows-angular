import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-raiz', // como se manda a llamar el componente en el index.html
  styleUrl: './app.css', // el estilo
  templateUrl: './app.html',// la plantilla
})
export class App {
  protected readonly title = signal('bungalows-angular');
}
