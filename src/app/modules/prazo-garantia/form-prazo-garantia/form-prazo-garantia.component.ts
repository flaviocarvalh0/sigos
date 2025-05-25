import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import { PrazoGarantia } from '../../../Models/prazo_garantia.model';
import { NgIf } from '@angular/common';

declare const bootstrap: any

@Component({
  selector: 'app-form-prazo_garantia',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './form-prazo-garantia.component.html',
  styleUrl: './form-prazo-garantia.component.css'
})
export class FormPrazoGarantiaComponent {
  form: FormGroup;
  isEditando = false;
  prazoId: number | null = null;
  toastMessage = '';

  constructor(
    private fb: FormBuilder,
    private prazoGarantiaService: PrazoGarantiaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      quantidade_de_dias: [0, [Validators.required, Validators.min(1)]],
      descricao: ['', [Validators.required]],
      ativo: [true]
    });
  }

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.prazoId = +id;
      this.isEditando = true;
      this.carregarPrazoGarantia();
    }
  }

  carregarPrazoGarantia(): void {
    if (this.prazoId) {
      this.prazoGarantiaService.buscarPorId(this.prazoId).subscribe({
        next: (prazo) => {
          if (prazo) {
            this.form.patchValue({
              quantidade_de_dias: prazo.quantidade_de_dias,
              descricao: prazo.descricao,
              ativo: prazo.ativo
            });
          }
        },
        error: () => {
          this.showToast('Erro ao carregar prazo de garantia');
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const prazo: PrazoGarantia = this.form.value;

      const operacao = this.isEditando && this.prazoId ?
        this.prazoGarantiaService.atualizar(this.prazoId, prazo) :
        this.prazoGarantiaService.criar(prazo);

      operacao.subscribe({
        next: () => {
          this.showToast(
            this.isEditando ?
              'Prazo de garantia atualizado com sucesso!' :
              'Prazo de garantia cadastrado com sucesso!'
          );
          this.router.navigate(['/prazo_garantia']);
        },
        error: () => {
          this.showToast(
            this.isEditando ?
              'Erro ao atualizar prazo de garantia' :
              'Erro ao cadastrar prazo de garantia'
          );
        }
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/prazo_garantia']);
  }

  onExcluir(): void {
    if (this.prazoId && confirm('Tem certeza que deseja excluir este prazo de garantia?')) {
      this.prazoGarantiaService.excluir(this.prazoId).subscribe({
        next: () => {
          this.showToast('Prazo de garantia excluído com sucesso!');
          this.router.navigate(['/prazo_garantia']);
        },
        error: () => {
          this.showToast('Erro ao excluir prazo de garantia');
        }
      });
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
