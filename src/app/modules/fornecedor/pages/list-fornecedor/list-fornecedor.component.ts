import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Fornecedor } from '../../../../Models/fornecedor.model';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { NgxMaskPipe, provideNgxMask } from 'ngx-mask'; // Para máscara de CNPJ e Celular

@Component({
  selector: 'app-list-fornecedor',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxMaskPipe],
  providers: [provideNgxMask()],
  templateUrl: './list-fornecedor.component.html',
  styleUrls: ['./list-fornecedor.component.css']
})
export class ListFornecedorComponent implements OnInit, OnDestroy {
  fornecedores: Fornecedor[] = [];
  isLoading = false;
  error: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private fornecedorService: FornecedorService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarFornecedores();
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
        this.error = err.message || 'Falha ao carregar empresas.';
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

  excluirFornecedor(id: number | undefined, nomeFornecedor: string): void {
    if (id === undefined) {
      this.toastService.warning('ID do fornecedor inválido para exclusão.');
      return;
    }

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Fornecedor',
      message: `Tem certeza que deseja excluir o fornecedor "${nomeFornecedor}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.fornecedorService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Fornecedor "${nomeFornecedor}" excluído com sucesso!`);
            this.carregarFornecedores(); // Recarrega a lista
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}