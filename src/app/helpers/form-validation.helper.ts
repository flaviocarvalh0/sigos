import { FormGroup, FormArray, AbstractControl } from '@angular/forms';

/**
 * Marca todos os campos de um FormGroup ou FormArray como "touched" e "dirty",
 * incluindo controles aninhados. Isso força a exibição dos erros de validação.
 * @param form FormGroup ou FormArray alvo.
 */
export function markAllAsTouchedAndDirty(form: FormGroup | FormArray): void {
  Object.keys(form.controls).forEach(field => {
    const control = form.get(field);

    if (control instanceof FormGroup || control instanceof FormArray) {
      markAllAsTouchedAndDirty(control);
    } else {
      control?.markAsTouched({ onlySelf: true });
      control?.markAsDirty({ onlySelf: true });
    }
  });
}

/**
 * Verifica se um controle específico está inválido e já foi tocado ou modificado.
 * Útil para exibir mensagens de erro e aplicar classes de validação no template.
 * @param form FormGroup ou FormArray onde está o controle.
 * @param controlName Nome do campo (ex: 'imei1', 'idCliente' etc).
 * @returns True se o campo estiver inválido e foi tocado ou sujo.
 */
export function isInvalid(form: FormGroup | FormArray, controlName: string): boolean {
  const control = form.get(controlName);
  return !!control && control.invalid && (control.touched || control.dirty);
}
