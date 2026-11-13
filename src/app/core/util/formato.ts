/** "09:00:00" -> "09:00" */
export function hora(valor: string | null): string {
  return valor ? valor.slice(0, 5) : '—';
}

export function nombreCompleto(p: { nombres: string; apellidos: string }): string {
  return `${p.apellidos}, ${p.nombres}`;
}

/** "Laura Giménez" -> "LG" */
export function iniciales(p: { nombres: string; apellidos: string }): string {
  return `${p.nombres.trim()[0] ?? ''}${p.apellidos.trim()[0] ?? ''}`.toUpperCase();
}
