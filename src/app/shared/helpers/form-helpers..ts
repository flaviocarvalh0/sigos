function isDataInvalidaOuZero(data: any): boolean {
  if (!data) return true;

  const dateStr = typeof data === 'string' ? data : new Date(data).toISOString();
  return dateStr.startsWith('0001-01-01') || isNaN(new Date(data).getTime());
}

export function limparDatasInvalidas(obj: any, campos: string[]): void {
  campos.forEach((campo) => {
    const valor = obj[campo];
    if (isDataInvalidaOuZero(valor)) {
      obj[campo] = null;
    } else {
      obj[campo] = new Date(valor);
    }
  });
}
