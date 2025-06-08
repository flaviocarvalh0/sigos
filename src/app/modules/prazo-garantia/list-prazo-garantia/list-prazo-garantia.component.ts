import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import { PrazoGarantia } from '../../../Models/prazo-garantia.model';
import { ListagemDinamicaComponent } from '../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../Models/confirmation.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-prazo-garantia',
  template: `<app-listagem-dinamica
              titulo="Lista de Prazo de Garantia"
              [dados]="dados"
              [colunas]="colunas"
              [carregando]="loading()"
              (editar)="editar($event)"
              (excluir)="excluir($event)"
              (criarNovo)="novo()">
            </app-listagem-dinamica>`,
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent]
})
export class ListPrazoGarantiaComponent implements OnInit, OnDestroy {
  dados: PrazoGarantia[] = [];
  carregando = false;
  subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'Id', ordenavel: true, filtro: true },
    { campo: 'descricao', titulo: 'Descrição', ordenavel: true, filtro: true },
    { campo: 'prazoEmDias', titulo: 'Prazo (dias)', ordenavel: true, filtro: false },
    { campo: 'ativo', titulo: 'Ativo', ordenavel: true, filtro: false },
  ];

  constructor(
    private prazoGarantiaService: PrazoGarantiaService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  loading(): boolean{
    return this.carregando;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarDados(): void {
    this.carregando = true;
    this.prazoGarantiaService.obterTodos().subscribe({
      next: (res) => {
        this.dados = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  editar(id: number): void {
    this.router.navigate(['/prazo_garantia/form', id]);
  }

  novo(): void {
    this.router.navigate(['/prazo_garantia/form']);
  }

  excluir(id: number): void {
    const item = this.dados.find(x => x.id === id);
    if (!item) {
      this.toastService.warning('Prazo de garantia não encontrado para exclusão.');
      return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o prazo "${item.descricao}"?`,
      acceptButtonText: 'Sim, Excluir',
      cancelButtonText: 'Cancelar',
      acceptButtonClass: 'btn-danger',
      cancelButtonClass: 'btn-secondary'
    };

    const sub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.carregando = true;
        this.prazoGarantiaService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Prazo "${item.descricao}" excluído com sucesso!`);
            this.carregarDados();
            this.carregando = false;
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir prazo.');
            this.carregando = false;
          }
        });
      }
    });

    this.subscriptions.add(sub);
  }
}
