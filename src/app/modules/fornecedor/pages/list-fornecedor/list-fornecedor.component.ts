// src/app/features/fornecedor/pages/list-fornecedor/list-fornecedor.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Fornecedor } from '../../../../Models/fornecedor.model';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-list-fornecedor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxMaskPipe,
    ListagemDinamicaComponent
  ],
  providers: [provideNgxMask()],
  template: `
    <app-listagem-dinamica
      titulo="Lista de Fornecedores"
      [dados]="fornecedores"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaNovoFornecedor()"
      (editar)="editarFornecedor($event)"
      (excluir)="excluirFornecedor($event)">
    </app-listagem-dinamica>
  `
})
export class ListFornecedorComponent implements OnInit, OnDestroy {
  fornecedores: Fornecedor[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '70px' },
    { campo: 'razaoSocial', titulo: 'Razão Social', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'cnpj', titulo: 'CNPJ', tipo: 'texto' as const, filtro: true },
    { campo: 'telefone', titulo: 'Telefone', tipo: 'texto' as const, filtro: true },
    { campo: 'email', titulo: 'E-mail', tipo: 'texto' as const, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private fornecedorService: FornecedorService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarFornecedores(): void {
    this.isLoading = true;
    const sub = this.fornecedorService.obterTodos().subscribe({
      next: (data) => {
        this.fornecedores = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar fornecedores:', err);
        this.toastService.error(err.message || 'Falha ao carregar fornecedores.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaNovoFornecedor(): void {
    this.router.navigate(['/fornecedor/form']);
  }

  editarFornecedor(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/fornecedor/form', id]);
    } else {
      this.toastService.warning('ID do fornecedor inválido para edição.');
    }
  }

  excluirFornecedor(id: number): void {
    if (!id) {
      this.toastService.warning('ID do fornecedor inválido para exclusão.');
      return;
    }

    const fornecedor = this.fornecedores.find(f => f.id === id);
    const nome = fornecedor?.razaoSocial || `Fornecedpr ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Fornecedor',
      message: `Tem certeza que deseja excluir o fornecedor "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.fornecedorService.remover(id!).subscribe({
          next: () => {
            this.toastService.success(`Fornecedor "${nome}" excluído com sucesso!`);
            this.carregarFornecedores();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir fornecedor.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
}
