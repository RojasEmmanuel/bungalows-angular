export interface EnumOption {
  value: string;
  label: string;
}

export interface ColaboradorFormOptions {
  estadosCivil: EnumOption[];
  turnos: EnumOption[];
  diasLaborales: EnumOption[];
  estatusColaborador: EnumOption[];
  estados: EnumOption[];
}