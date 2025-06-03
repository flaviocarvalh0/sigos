// Estas funções podem ser colocadas em um arquivo utilitário de validadores
// ou, para simplificação neste exemplo, você pode adaptá-las como métodos
// estáticos ou funções dentro do escopo do seu componente, se preferir não criar um arquivo separado agora.

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cpf = control.value ? String(control.value).replace(/\D/g, '') : '';

    if (!cpf) { // Se o campo estiver vazio, não aplicar esta validação (deixar para o Validators.required)
      return null;
    }

    if (cpf.length !== 11 || /^(.)\1+$/.test(cpf)) {
      return { cpfInvalid: true, message: 'CPF com formato inválido.' };
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;

    if ((remainder === 10) || (remainder === 11)) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(9, 10), 10)) {
      return { cpfInvalid: true, message: 'CPF com dígito verificador inválido.' };
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }
    remainder = (sum * 10) % 11;

    if ((remainder === 10) || (remainder === 11)) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(10, 11), 10)) {
      return { cpfInvalid: true, message: 'CPF com dígito verificador inválido.' };
    }

    return null; // CPF válido
  };
}

export function cnpjValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cnpj = control.value ? String(control.value).replace(/\D/g, '') : '';

    if (!cnpj) { // Se o campo estiver vazio, não aplicar esta validação
      return null;
    }

    if (cnpj.length !== 14 || /^(.)\1+$/.test(cnpj)) {
      return { cnpjInvalid: true, message: 'CNPJ com formato inválido.' };
    }

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) {
      return { cnpjInvalid: true, message: 'CNPJ com dígito verificador inválido.' };
    }

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1), 10)) {
      return { cnpjInvalid: true, message: 'CNPJ com dígito verificador inválido.' };
    }

    return null; // CNPJ válido
  };
}