import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectItem } from '../../../Models/select-item.model';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao_estoque.service';
import { PecaService } from '../../../services/peca.service';
import { ToastService } from '../../../services/toast.service';
import { MovimentacaoEstoqueCriacaoPayload } from '../../../Models/movimento_estoque.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-form-movimento-estoque',
  imports: [NgSelectModule, ReactiveFormsModule, NgIf],
  templateUrl: './form-movimento-estoque.component.html',
  styleUrl: './form-movimento-estoque.component.css'
})
export class FormMovimentoEstoqueComponent {
  form: FormGroup;
  pecas: SelectItem[] = [];
  carregandoPecas = false;

  constructor(
    private fb: FormBuilder,
    private movimentacaoService: MovimentacaoEstoqueService,
    private pecaService: PecaService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      idPeca: [null, Validators.required],
      tipoMovimentacao: ['ENTRADA', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    this.carregarPecas();
  }

  carregarPecas(): void {
    this.carregandoPecas = true;
    this.pecaService.obterParaSelecao().subscribe({
      next: pecas => this.pecas = pecas,
      error: () => this.toastService.error('Erro ao carregar peças.'),
      complete: () => this.carregandoPecas = false
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: MovimentacaoEstoqueCriacaoPayload = this.form.value;

    this.movimentacaoService.criar(payload).subscribe({
      next: () => {
        this.toastService.success('Movimentação registrada com sucesso!');
        this.router.navigate(['/movimento-estoque']);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao registrar movimentação.');
      }
    });
  }

  onCancelar(): void {
    this.router.navigate(['/movimento-estoque']);
  }
}
