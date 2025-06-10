import { FormGroup, FormArray, AbstractControl } from '@angular/forms';

/**
 * Percorre todos os controles de um FormGroup (incluindo FormArrays aninhados)
 * e os marca como 'touched' e 'dirty' para disparar a exibição de erros de validação na UI.
 * @param form O FormGroup a ser validado.
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
