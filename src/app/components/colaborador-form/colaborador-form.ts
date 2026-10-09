import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { ColaboradorService } from '../../services/colaborador.service';
import { PuestoService } from '../../services/puesto.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { EnumsService } from '../../services/enums.service';
import { UploadColaboradorService } from '../../services/upload/colaborador-upload.service';

import {
  ColaboradorRequest,
  ColaboradorTable,
} from '../../models/colaborador.model';
import { PuestoResponse } from '../../models/puesto.model';
import { UbicacionResponse } from '../../models/ubicacion.model';
import { EnumOption } from '../../models/enum-option.model';

/** Configuración de cada paso del wizard */
interface PasoConfig {
  label: string;
  descripcion: string;
  campos: string[];
}

const PASOS: PasoConfig[] = [
  {
    label: 'Datos personales',
    descripcion: 'Información personal y fotografía del colaborador.',
    campos: ['nombre', 'ap', 'am', 'fechaNacimiento', 'estadoCivil'],
  },
  {
    label: 'Datos laborales',
    descripcion: 'Puesto, ubicación, horario y condiciones laborales.',
    campos: [
      'fechaIngreso', 'sueldo', 'turno', 'diaDescanso',
      'entrada', 'salida', 'estatus', 'idPuesto', 'idUbicacion',
    ],
  },
  {
    label: 'Información',
    descripcion: 'Datos confidenciales del colaborador.',
    campos: ['curp', 'nss', 'rfc'],
  },
  {
    label: 'Dirección',
    descripcion: 'Domicilio actual del colaborador.',
    campos: ['calle', 'colonia', 'ciudad', 'estado', 'cp'],
  },
];

@Component({
  selector: 'app-colaborador-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './colaborador-form.html',
  styleUrl: './colaborador-form.css',
})
export class ColaboradorForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly puestoService = inject(PuestoService);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly enumsService = inject(EnumsService);
  private readonly uploadService = inject(UploadColaboradorService);

  creado = output<ColaboradorTable>();
  cancelado = output<void>();

  // ---------- Configuración del wizard ----------
  readonly pasos = PASOS;
  readonly totalPasos = PASOS.length;

  pasoActual = signal(0);

  esPrimerPaso = computed(() => this.pasoActual() === 0);
  esUltimoPaso = computed(() => this.pasoActual() === this.totalPasos - 1);
  pasoConfig = computed(() => this.pasos[this.pasoActual()]);
  progreso = computed(() =>
    Math.round(((this.pasoActual() + 1) / this.totalPasos) * 100)
  );

  // ---------- Catálogos ----------
  puestos = signal<PuestoResponse[]>([]);
  ubicaciones = signal<UbicacionResponse[]>([]);
  estadosCivil = signal<EnumOption[]>([]);
  turnos = signal<EnumOption[]>([]);
  diasLaborales = signal<EnumOption[]>([]);
  estatusList = signal<EnumOption[]>([]);
  estados = signal<EnumOption[]>([]);

  cargandoCatalogos = signal(false);
  errorCatalogos = signal<string | null>(null);

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    // Datos personales
    nombre: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    ap: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    am: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['', [Validators.required]],

    // Datos laborales
    fechaIngreso: ['', [Validators.required]],
    sueldo: [0, [Validators.required, Validators.min(1000)]],
    turno: ['', [Validators.required]],
    diaDescanso: ['', [Validators.required]],
    entrada: ['08:00', [Validators.required]],
    salida: ['17:00', [Validators.required]],
    estatus: ['', [Validators.required]],
    idPuesto: [null as number | null, [Validators.required]],
    idUbicacion: [null as number | null, [Validators.required]],

    // Datos confidenciales
    curp: ['', [Validators.required]],
    nss: ['', [Validators.required]],
    rfc: ['', [Validators.required]],

    // Dirección
    calle: ['', [Validators.required]],
    colonia: ['', [Validators.required]],
    ciudad: ['', [Validators.required]],
    estado: ['', [Validators.required]],
    cp: ['', [Validators.required]],
  });

  // ---------- Estado de la foto ----------
  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  fotografiaPath = signal<string | null>(null);

  // ---------- Estados UI ----------
  subiendoFoto = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  nombreArchivo = computed(() => this.archivo()?.name ?? '');
  enviando = computed(() => this.subiendoFoto() || this.guardando());

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
  }

  // ---------- Carga de catálogos ----------
  private cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set(null);

    forkJoin({
      puestos: this.puestoService.getPuestos(),
      ubicaciones: this.ubicacionService.getUbicaciones(),
      estadosCivil: this.enumsService.getEstadosCivil(),
      turnos: this.enumsService.getTurnos(),
      diasLaborales: this.enumsService.getDiasLaborales(),
      estatusList: this.enumsService.getEstatusColaborador(),
      estados: this.enumsService.getEstados(),
    }).subscribe({
      next: (res: {
        puestos: PuestoResponse[];
        ubicaciones: UbicacionResponse[];
        estadosCivil: EnumOption[];
        turnos: EnumOption[];
        diasLaborales: EnumOption[];
        estatusList: EnumOption[];
        estados: EnumOption[];
      }) => {
        this.puestos.set(res.puestos);
        this.ubicaciones.set(res.ubicaciones);
        this.estadosCivil.set(res.estadosCivil);
        this.turnos.set(res.turnos);
        this.diasLaborales.set(res.diasLaborales);
        this.estatusList.set(res.estatusList);
        this.estados.set(res.estados);

        this.form.patchValue({
          estadoCivil: res.estadosCivil[0]?.value ?? '',
          turno: res.turnos[0]?.value ?? '',
          diaDescanso: res.diasLaborales[0]?.value ?? '',
          estatus: res.estatusList[0]?.value ?? '',
          estado: res.estados[0]?.value ?? '',
        });

        this.cargandoCatalogos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar catálogos', err);
        this.errorCatalogos.set('No se pudieron cargar los catálogos.');
        this.cargandoCatalogos.set(false);
      },
    });
  }

  // ---------- Navegación del wizard ----------
  siguiente(): void {
    if (!this.pasoEsValido()) {
      this.marcarPasoTocado();
      return;
    }
    if (this.esUltimoPaso()) return;
    this.pasoActual.update((p) => p + 1);
  }

  atras(): void {
    if (this.esPrimerPaso()) return;
    this.pasoActual.update((p) => p - 1);
  }

  /** Valida todos los campos del paso actual */
  private pasoEsValido(): boolean {
    return this.pasoConfig().campos.every((c) => {
      const ctrl = this.form.get(c);
      return !ctrl || ctrl.valid;
    });
  }

  /** Marca como touched todos los campos del paso actual */
  private marcarPasoTocado(): void {
    this.pasoConfig().campos.forEach((c) => {
      this.form.get(c)?.markAsTouched();
    });
  }

  // ---------- Foto ----------
  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(file.type)) {
      this.errorGeneral.set('Formato no permitido. Usa JPG, PNG o WEBP.');
      input.value = '';
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      this.errorGeneral.set(`La foto no debe pesar más de ${maxMB} MB.`);
      input.value = '';
      return;
    }

    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);

    this.errorGeneral.set(null);
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarFoto(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
    this.archivo.set(null);
    this.previewUrl.set(null);
    this.fotografiaPath.set(null);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Salta al primer paso inválido
      const idx = this.pasos.findIndex((p) =>
        p.campos.some((c) => this.form.get(c)?.invalid)
      );
      if (idx >= 0) this.pasoActual.set(idx);
      return;
    }

    this.errorGeneral.set(null);

    if (this.archivo()) {
      this.subirFotoYCrear();
    } else {
      this.crearColaborador();
    }
  }

  private subirFotoYCrear(): void {
    this.subiendoFoto.set(true);

    this.uploadService.subirFoto(this.archivo()!).subscribe({
      next: (res) => {
        this.fotografiaPath.set(res.path);
        this.subiendoFoto.set(false);
        this.crearColaborador();
      },
      error: (err) => {
        console.error('Error al subir foto', err);
        this.errorGeneral.set('No se pudo subir la foto. Intenta de nuevo.');
        this.subiendoFoto.set(false);
      },
    });
  }

  private crearColaborador(): void {
    this.guardando.set(true);
    const v = this.form.getRawValue();

    const body: ColaboradorRequest = {
      nombre: v.nombre,
      ap: v.ap,
      am: v.am,
      fechaNacimiento: v.fechaNacimiento,
      estadoCivil: v.estadoCivil,
      fotografia: this.fotografiaPath(),
      fechaIngreso: v.fechaIngreso,
      sueldo: v.sueldo,
      turno: v.turno,
      diaDescanso: v.diaDescanso,
      entrada: this.normalizarHora(v.entrada),
      salida: this.normalizarHora(v.salida),
      estatus: v.estatus,
      idPuesto: v.idPuesto!,
      idUbicacion: v.idUbicacion!,
      curp: v.curp,
      nss: v.nss,
      rfc: v.rfc,
      calle: v.calle,
      colonia: v.colonia,
      ciudad: v.ciudad,
      estado: v.estado,
      cp: v.cp,
    };

    this.colaboradorService.crearColaborador(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.creado.emit(res);
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear colaborador', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Helpers ----------
  private normalizarHora(hora: string): string {
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  private reset(): void {
    this.form.reset({
      nombre: '',
      ap: '',
      am: '',
      fechaNacimiento: '',
      estadoCivil: this.estadosCivil()[0]?.value ?? '',
      fechaIngreso: '',
      sueldo: 0,
      turno: this.turnos()[0]?.value ?? '',
      diaDescanso: this.diasLaborales()[0]?.value ?? '',
      entrada: '08:00',
      salida: '17:00',
      estatus: this.estatusList()[0]?.value ?? '',
      idPuesto: null,
      idUbicacion: null,
      curp: '',
      nss: '',
      rfc: '',
      calle: '',
      colonia: '',
      ciudad: '',
      estado: this.estados()[0]?.value ?? '',
      cp: '',
    });
    this.quitarFoto();
    this.fotografiaPath.set(null);
    this.pasoActual.set(0);
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      const mensajes = Object.values(body.errors) as string[];
      return mensajes.join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo crear el colaborador. Intenta de nuevo.';
  }

  errorDe(campo: string): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('minlength')) {
      const req = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${req} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const req = control.getError('maxlength').requiredLength;
      return `Debe tener máximo ${req} caracteres`;
    }
    if (control.hasError('min')) {
      return `El valor mínimo es ${control.getError('min').min}`;
    }
    return 'Campo inválido';
  }
}