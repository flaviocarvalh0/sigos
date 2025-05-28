import { NgSelectModule } from '@ng-select/ng-select';
// movimentacao-estoque-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao_estoque.service';
import { PecaService } from '../../../services/peca.service';
import { NgIf } from '@angular/common';

declare const bootstrap: any;

@Component({
  selector: 'app-form-movimento-estoque',
  imports: [NgSelectModule, ReactiveFormsModule, NgIf],
  templateUrl: './form-movimento-estoque.component.html',
  styleUrl: './form-movimento-estoque.component.css'
})
export class FormMovimentoEstoqueComponent {
  form: FormGroup;
  isEditando = false;
  movimentacaoId?: number;
  pecas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movimentacaoService: MovimentacaoEstoqueService,
    private pecaService: PecaService
  ) {
    this.form = this.fb.group({
      id_peca: [null, Validators.required],
      tipo_de_movimentacao: ['ENTRADA', Validators.required],
      quantidade: [0, [Validators.required, Validators.min(1)]],
      data: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.pecaService.listar().subscribe(pecas => this.pecas = pecas);

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditando = true;
        this.movimentacaoId = +id;
        this.movimentacaoService.buscarPorId(this.movimentacaoId).subscribe(m => {
          if (m) this.form.patchValue(m);
        });
      }
    });
  }


onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const data = this.form.getRawValue();

  const operacao = this.isEditando && this.movimentacaoId
    ? this.movimentacaoService.atualizar(this.movimentacaoId, data)
    : this.movimentacaoService.criar(data);

  operacao.subscribe({
    next: () => {
      this.router.navigate(['/movimento-estoque']);
    },
    error: (err) => {
      this.showToast('Erro ao salvar movimentação: ' + err.message);
    }
  });
}


  onCancelar(): void {
    this.router.navigate(['/movimento-estoque']);
  }

  onExcluir(): void {
    if (this.movimentacaoId && confirm('Deseja realmente excluir esta movimentação?')) {
      this.movimentacaoService.excluir(this.movimentacaoId).subscribe(() => {
        this.router.navigate(['/movimento-estoque']);
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