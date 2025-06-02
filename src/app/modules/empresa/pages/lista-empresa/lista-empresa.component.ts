// src/app/modules/empresa/pages/lista-empresa/lista-empresa.component.ts
import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Empresa } from '../../../../Models/empresa.model';
import { EmpresaService } from '../../../../services/empresa.service';
import { ToastService } from '../../../../services/toast.service'; // Importar
import { ConfirmationService } from '../../../../services/confirmation.service'; // Importar
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Importar

@Component({
  selector: 'app-lista-empresa', // Corrigido o seletor de 'app-empresa-list' para 'app-lista-empresa'
  standalone: true, // Adicionado standalone: true
  imports: [CommonModule, RouterModule, ],
  templateUrl: './lista-empresa.component.html',
  styleUrls: ['./lista-empresa.component.css'] // Adicionado styleUrls
})
export class ListEmpresaComponent implements OnInit, OnDestroy {
  empresas: Empresa[] = [];
  isLoading = false;
  error: string | null = null; // Para mensagens de erro no template

  private subscriptions = new Subscription();

  constructor(
    private empresaService: EmpresaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    this.error = null;
    const sub = this.empresaService.obterTodos().subscribe({ // Usar obterTodos do CrudService
      next: (data) => {
        this.empresas = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
        this.error = err.message || 'Falha ao carregar empresas.';
        this.toastService.error(this.error!);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  editar(id: number | undefined): void { // Adicionado verificação para id undefined
    if (id !== undefined) {
      this.router.navigate(['/empresa/form', id]);
    } else {
        this.toastService.error('ID da empresa inválido para edição.');
    }
  }

  excluir(id: number | undefined, nomeEmpresa: string): void { // Adicionado nomeEmpresa para o diálogo
    if (id === undefined) {
        this.toastService.error('ID da empresa inválido para exclusão.');
        return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a empresa "${nomeEmpresa}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true; // Pode ser útil ter um loading específico para a operação de exclusão
        const deleteSub = this.empresaService.remover(id).subscribe({ // Usar remover do CrudService
          next: () => {
            this.toastService.success('Empresa excluída com sucesso!');
            this.loadEmpresas(); // Recarrega a lista (isLoading será tratado por loadEmpresas)
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

  novo(): void {
    this.router.navigate(['/empresa/form']);
  }

  formatCelular(celular: string | null | undefined): string {
  if (!celular) return '';
  // Remove non-digit characters
  const digits = celular.replace(/\D/g, '');
  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return celular;
}

formatCnpj(cnpj: string): string {
  if (!cnpj) return '-';
  // Remove non-digit characters
  cnpj = cnpj.replace(/\D/g, '');
  // Format as 00.000.000/0000-00
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
