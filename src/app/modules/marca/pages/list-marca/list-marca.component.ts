// src/app/features/marca/pages/list-marca/list-marca.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { MarcaService } from '../../../../services/marca.service';
import { Marca } from '../../../../Models/marca.model';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-list-marca',
  standalone: true,
  template: `
    <app-listagem-dinamica
      titulo="Lista de Marcas"
      [dados]="marcas"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaNovaMarca()"
      (editar)="editarMarca($event)"
      (excluir)="excluirMarca($event)">
    </app-listagem-dinamica>
  `,
  imports: [CommonModule, FormsModule, ListagemDinamicaComponent]
})
export class ListMarcaComponent implements OnInit, OnDestroy {
  marcas: Marca[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private marcaService: MarcaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarListaMarcas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaMarcas(): void {
    this.isLoading = true;
    const sub = this.marcaService.getMarcas().subscribe({
      next: (data) => {
        this.marcas = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar marcas', err);
        this.toastService.error(err.message || 'Falha ao carregar lista de marcas.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaNovaMarca(): void {
    this.router.navigate(['/marca/form']);
  }

  editarMarca(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID da marca inválido para edição.');
      return;
    }
    this.router.navigate(['/marca/form', id]);
  }

  excluirMarca(id: number): void {
    if (!id) {
      this.toastService.warning('ID da marca inválido para exclusão.');
      return;
    }

      const marca = this.marcas.find(m => m.id === id);
     const nome = marca?.nome || `Marca ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Marca',
      message: `Tem certeza que deseja excluir a marca "${nome}"? Modelos associados a esta marca podem ser afetados.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.marcaService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Marca "${nome}" excluída com sucesso!`);
            this.carregarListaMarcas();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir marca. Verifique se ela não está em uso.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
}
