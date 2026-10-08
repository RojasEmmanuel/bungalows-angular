import { Component } from '@angular/core';

@Component({
  selector: 'app-nominas',
  standalone: true,
  template: `
    <section class="rounded-2xl bg-white p-6">
      <h2 class="text-xl font-bold text-slate-800">Nóminas</h2>
      <p class="mt-2 text-slate-500">Gestión de nóminas.</p>
    </section>
  `,
})
export class NominasComponent {}