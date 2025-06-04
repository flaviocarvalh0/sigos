// src/app/features/modelo/pages/list-modelo/list-modelo.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ModeloService } from '../../../../services/modelo.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Modelo } from '../../../../Models/modelo.model';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-list-modelo',
  standalone: true,
  imports: [CommonModule, FormsModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Modelos"
      [dados]="modelos"
      [colunas]="colunas"
      [carregando]="carregando"
      (criarNovo)="novoModelo()"
      (editar)="editarModelo($event)"
      (excluir)="excluirModelo($event)">
    </app-listagem-dinamica>
  `
})
export class ListModeloComponent implements OnInit, OnDestroy {
  modelos: Modelo[] = [];
  carregando = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, filtro: true, ordenavel: true },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, filtro: true, ordenavel: true },
    { campo: 'nomeMarca', titulo: 'Marca', tipo: 'texto' as const, filtro: true, ordenavel: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private modeloService: ModeloService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarListaModelos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaModelos(): void {
    this.carregando = true;
    const sub = this.modeloService.obterTodos().subscribe({
      next: (dados) => {
        this.modelos = dados;
        this.carregando = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao carregar modelos.');
        this.carregando = false;
      }
    });
    this.subscriptions.add(sub);
  }

  editarModelo(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID do modelo inválido para edição.');
      return;
    }
    this.router.navigate(['/modelo/form', id]);
  }

  novoModelo(): void {
    this.router.navigate(['/modelo/form']);
  }

  excluirModelo(id: number): void {
    if (!id) {
      this.toastService.warning('ID do modelo inválido para exclusão.');
      return;
    }

      const modelo = this.modelos.find(m => m.id === id);
      const nome = modelo?.nome || `Modelo ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Modelo',
      message: `Tem certeza que deseja excluir o modelo "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar'
    };

    const sub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.carregando = true;
        this.modeloService.remover(id!).subscribe({
          next: () => {
            this.toastService.success(`Modelo "${nome}" excluído com sucesso!`);
            this.carregarListaModelos();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir modelo.');
            this.carregando = false;
          }
        });
      }
    });
    this.subscriptions.add(sub);
  }
}
