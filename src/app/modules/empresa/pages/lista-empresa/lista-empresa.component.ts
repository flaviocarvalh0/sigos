// src/app/modules/empresa/pages/lista-empresa/lista-empresa.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { Empresa } from '../../../../Models/empresa.model';
import { EmpresaService } from '../../../../services/empresa.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-lista-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ListagemDinamicaComponent
  ],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Empresas"
      [dados]="empresas"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="novo()"
      (editar)="editar($event)"
      (excluir)="excluir($event)">
    </app-listagem-dinamica>
  `,
  styleUrls: ['./lista-empresa.component.css']
})
export class ListEmpresaComponent implements OnInit, OnDestroy {
  empresas: Empresa[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '70px' },
    { campo: 'razaoSocial', titulo: 'Razão Social', tipo: 'texto' as const, filtro: true, ordenavel: true },
    { campo: 'cnpj', titulo: 'CNPJ', tipo: 'texto' as const, filtro: true },
    { campo: 'telefone', titulo: 'Telefone', tipo: 'texto' as const, filtro: true },
    { campo: 'email', titulo: 'E-mail', tipo: 'texto' as const, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private empresaService: EmpresaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    const sub = this.empresaService.obterTodos().subscribe({
      next: (data) => {
        this.empresas = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
        this.toastService.error(err.message || 'Falha ao carregar empresas.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  novo(): void {
    this.router.navigate(['/empresa/form']);
  }

  editar(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/empresa/form', id]);
    } else {
      this.toastService.error('ID da empresa inválido para edição.');
    }
  }

  excluir(id: number): void {
    if (!id) {
      this.toastService.error('ID da empresa inválido para exclusão.');
      return;
    }

    const empresa = this.empresas.find(e => e.id === id);
    const nome = empresa?.razaoSocial || `Empresa ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a empresa "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.empresaService.remover(id!).subscribe({
          next: () => {
            this.toastService.success(`Empresa "${nome}" excluída com sucesso!`);
            this.loadEmpresas();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir empresa.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
}
