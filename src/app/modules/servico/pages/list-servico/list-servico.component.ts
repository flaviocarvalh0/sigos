import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ServicoService } from '../../../../services/servico.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Servico } from '../../../../Models/servico.mode';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ModalService } from '../../../../services/dialog.service';
import { FormServicoComponent } from '../form-servico/form-servico.component';

@Component({
  selector: 'app-list-servico',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Serviços"
      [dados]="servicosFiltrados"
      [colunas]="colunas"
      [carregando]="isLoading"
      (editar)="editarServico($event)"
      (excluir)="excluirServico($event)"
      (criarNovo)="novoServico()">
    </app-listagem-dinamica>
  `
})
export class ListServicoComponent implements OnInit, OnDestroy {
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'descricao', titulo: 'Descrição', tipo: 'texto' as const, filtro: true },
    { campo: 'precoPadrao', titulo: 'Valor', tipo: 'moeda' as const, ordenavel: true, filtro: false },
    { campo: 'tempoEstimadoMinutos', titulo: 'Tempo (min)', tipo: 'texto' as const, filtro: false },
    { campo: 'criadoPor', titulo: 'Criado por', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'modificadoPor', titulo: 'Modificado por', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private servicoService: ServicoService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.carregarListaServicos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaServicos(): void {
    this.isLoading = true;
    const sub = this.servicoService.obterTodos().subscribe({
      next: (data) => {
        this.servicos = data.sort((a, b) => a.nome.localeCompare(b.nome));
        this.servicosFiltrados = [...this.servicos];
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar serviços.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  editarServico(id: number): void {
    this.modalService.open(FormServicoComponent, { servicoIdParaEditar: id }).then(result => {
      if (result === 'salvo' || result === 'excluido') {
        this.carregarListaServicos();
      }
    });
  }

  novoServico(): void {
    this.modalService.open(FormServicoComponent).then(result => {
      if (result === 'salvo') {
        this.carregarListaServicos();
      }
    });
  }

  excluirServico(id: number): void {
    const servico = this.servicos.find(s => s.id === id);
    const nome = servico?.nome || `Serviço ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Serviço',
      message: `Tem certeza que deseja excluir o serviço "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      // ✅ Cancelar a subscription após o clique (para evitar múltiplos listeners acumulando)
      confirmSub.unsubscribe();

      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.servicoService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Serviço "${nome}" excluído com sucesso!`);
            this.carregarListaServicos();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir serviço.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
  }
}
