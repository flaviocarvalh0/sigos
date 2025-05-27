import { NgSelectModule } from '@ng-select/ng-select';
// movimentacao-estoque-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao_estoque.service';
import { PecaService } from '../../../services/peca.service';
import { NgIf } from '@angular/common';
import { EstoqueService } from '../../../services/estoque.service';
import { Estoque } from '../../../Models/estoque.model';

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
  estoque: Estoque | undefined = undefined;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movimentacaoService: MovimentacaoEstoqueService,
    private pecaService: PecaService,
    private estoqueSevice: EstoqueService
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

  buscarEstoquePorPecaId(pecaId: number): Estoque | undefined {
    if (!pecaId) return undefined;

    this.estoqueSevice.buscarPorPeca(pecaId).subscribe(estoque => {
      this.estoque = estoque;
    });

    return this.estoque;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue();

    if (this.isEditando && this.movimentacaoId) {
      this.movimentacaoService.atualizar(this.movimentacaoId, data).subscribe(() => {
      });
    } else {
      this.movimentacaoService.criar(data).subscribe(() => {
      });
    }

    this.estoque = this.buscarEstoquePorPecaId(data.id_peca);

    if (this.estoque) {
      if(this.estoque.quantidade_atual === undefined || this.estoque.quantidade_atual < 0) {
        alert('Quantidade atual do estoque não pode ser negativa ou indefinida.');
        return;
      }
      if (data.tipo_de_movimentacao === 'ENTRADA') {
        this.estoque.quantidade_atual += data.quantidade;
      } else if (data.tipo_de_movimentacao === 'SAIDA') {
        this.estoque.quantidade_atual -= data.quantidade;
      }
      this.estoqueSevice.atualizarQuantidadeEstoque(this.estoque.id!, this.estoque).subscribe();

      this.router.navigate(['/movimento-estoque']);
    }else{
      console.error('Estoque não encontrado para a peça selecionada.');
      alert('Estoque não encontrado para a peça selecionada.');
    }
  }
  onPecaChange(pecaId: number): void {
    this.buscarEstoquePorPecaId(pecaId);
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
}
