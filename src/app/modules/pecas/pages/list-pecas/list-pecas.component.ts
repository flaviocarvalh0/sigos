import { ConfirmationService } from './../../../../services/confirmation.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PecaService } from '../../../../services/peca.service';
import { ToastService } from '../../../../services/toast.service';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { Peca } from '../../../../Models/peca.model';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-peca',
  template: `<app-listagem-dinamica
    titulo="Lista de Peças"
    [dados]="pecas"
    [colunas]="colunas"
    (editar)="editarPeca($event)"
    (excluir)="excluir($event)"
    (criarNovo)="novaPeca()"
    (carregando)="loading()"
  >
  </app-listagem-dinamica>`,
  standalone: true,
  imports: [CommonModule, FormsModule, ListagemDinamicaComponent],
})
export class ListPecaComponent implements OnInit {
  carregando = false;
  subscriptions = new Subscription();
  novaPeca() {
    this.router.navigate(['/peca/form']);
  }
  pecas: Peca[] = [];
  colunas = [
  {
    campo: 'id',
    titulo: 'ID',
    ordenavel: true,
    largura: '80px',
    filtro: true,
    tipo: 'texto' as const
  },
  { campo: 'nome', titulo: 'Nome', ordenavel: true, filtro: true, tipo: 'texto' as const },
  {
    campo: 'precoCusto',
    titulo: 'Preço Custo',
    tipo: 'moeda' as const,
    filtro: false,
  },
  {
    campo: 'precoVenda',
    titulo: 'Preço Venda',
    tipo: 'moeda' as const,
    filtro: false,
  },
  { campo: 'localizacaoFisica', titulo: 'Localização', filtro: true, tipo: 'texto' as const },
  { campo: 'quantidadeEstoque', titulo: 'Qtd Estoque', filtro: false, tipo: 'texto' as const },
  { campo: 'quantidadeMinimaEstoque', titulo: 'Qtd Mínima', filtro: false, tipo: 'texto' as const },
];


  constructor(
    private pecaService: PecaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarPecas();
  }

  carregarPecas(): void {
    this.pecaService.obterTodos().subscribe({
      next: (pecas) => (this.pecas = pecas),
      error: (err) =>
        this.toastService.error('Erro ao carregar peças: ' + err.message),
    });
  }

  loading(): boolean{
    return this.carregando;
  }

  editarPeca(id: number): void {
    this.router.navigate(['/peca/form', id]);
  }

  excluir(id: number): void {
    const peca = this.pecas.find((p) => p.id === id);

    if (!peca) {
      this.toastService.warning('Peça não encontrada para exclusão.');
      return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a peça "${peca.nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      cancelButtonText: 'Cancelar',
      acceptButtonClass: 'btn-danger',
    };

    const sub = this.confirmationService
      .confirm(config)
      .subscribe((confirmado) => {
        if (confirmado) {
          this.carregando = true;
          this.pecaService.remover(id).subscribe({
            next: () => {
              this.toastService.success(
                `Peça "${peca.nome}" excluída com sucesso!`
              );
              this.carregarPecas();
              this.carregando = false;
            },
            error: (err) => {
              this.toastService.error(err.message || 'Erro ao excluir a peça.');
              this.carregando = false;
            },
          });
        }
      });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
  this.subscriptions.unsubscribe();
}
}
