import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import { PrazoGarantia } from '../../../Models/prazo-garantia.model';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../Models/confirmation.model';
import { ListagemDinamicaComponent } from '../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ModalService } from '../../../services/dialog.service';
import { FormPrazoGarantiaComponent } from '../form-prazo-garantia/form-prazo-garantia.component';

@Component({
  selector: 'app-list-prazo-garantia',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Prazo de Garantia"
      [dados]="dados"
      [colunas]="colunas"
      [carregando]="carregando"
      (criarNovo)="novo()"
      (editar)="editar($event)"
      (excluir)="excluir($event)">
    </app-listagem-dinamica>
  `
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
    // Campos de Auditoria:
    { campo: 'criadoPor', titulo: 'Criado por', ordenavel: true, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'dataHora' as const, ordenavel: true },
    { campo: 'modificadoPor', titulo: 'Modificado por', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private prazoGarantiaService: PrazoGarantiaService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarDados(): void {
    this.carregando = true;
    const sub = this.prazoGarantiaService.obterTodos().subscribe({
      next: (res) => {
        this.dados = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
    this.subscriptions.add(sub);
  }

  novo(): void {
    this.modalService.open(FormPrazoGarantiaComponent).then(result => {
      if (result === 'salvo') {
        this.carregarDados();
      }
    });
  }

  editar(id: number): void {
    this.modalService.open(FormPrazoGarantiaComponent, {
      prazoIdParaEditar: id
    }).then(result => {
      if (result === 'salvo' || result === 'excluido') {
        this.carregarDados();
      }
    });
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
