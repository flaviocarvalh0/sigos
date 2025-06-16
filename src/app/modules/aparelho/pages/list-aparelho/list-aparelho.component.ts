import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Aparelho } from '../../../../Models/aparelho.model';
import { AparelhoService } from '../../../../services/aparelho.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { FormAparelhoComponent } from '../form-aparelho/form-aparelho.component';
import { ModalService } from '../../../../services/dialog.service';

declare const bootstrap: any;

@Component({
  selector: 'app-list-aparelho',
  standalone: true,
  template: `
    <app-listagem-dinamica
      titulo="Lista de Aparelhos"
      [dados]="aparelhos"
      [colunas]="colunas"
      [carregando]="isLoading"
      (editar)="editarAparelho($event)"
      (excluir)="excluirAparelho($event)"
      (criarNovo)="abrirModalParaCriar()"
    ></app-listagem-dinamica>
  `,
  imports: [CommonModule, RouterModule, FormsModule, ListagemDinamicaComponent],
  providers: [provideNgxMask()],
})
export class ListAparelhoComponent implements OnInit, OnDestroy {
  @ViewChild('formModalRef') formModalRef!: ElementRef;
  private formModalInstance: any;
  aparelhos: Aparelho[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    {
      campo: 'id',
      titulo: 'ID',
      ordenavel: true,
      filtro: true,
      largura: '70px',
      tipo: 'texto' as const,
    },
    {
      campo: 'imei1',
      titulo: 'IMEI 1',
      ordenavel: true,
      filtro: true,
      tipo: 'texto' as const,
    },
    { campo: 'imei2', titulo: 'IMEI 2', filtro: false, tipo: 'texto' as const },
    {
      campo: 'numeroSerie',
      titulo: 'Nº Série',
      filtro: true,
      tipo: 'texto' as const,
    },
    { campo: 'cor', titulo: 'Cor', filtro: true, tipo: 'texto' as const },
    {
      campo: 'descricaoAuxiliar',
      titulo: 'Descrição',
      filtro: true,
      tipo: 'texto' as const,
    },
    {
      campo: 'nomeCliente',
      titulo: 'Cliente',
      filtro: true,
      tipo: 'texto' as const,
    },
    {
      campo: 'nomeMarca',
      titulo: 'Marca',
      filtro: true,
      tipo: 'texto' as const,
    },
    {
      campo: 'nomeModelo',
      titulo: 'Modelo',
      filtro: true,
      tipo: 'texto' as const,
    },
    {
      campo: 'dataCriacao',
      titulo: 'Criado em',
      tipo: 'data' as const,
      ordenavel: true,
    },
    {
      campo: 'dataModificacao',
      titulo: 'Modificado em',
      tipo: 'dataHora' as const,
      ordenavel: true,
    },
  ];

  constructor(
    private aparelhoService: AparelhoService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.carregarListaAparelhos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (this.formModalRef?.nativeElement) {
      this.formModalInstance = new bootstrap.Modal(
        this.formModalRef.nativeElement,
        {
          backdrop: 'static',
          keyboard: false,
        }
      );
    }
  }

  carregarListaAparelhos(): void {
    this.isLoading = true;
    const sub = this.aparelhoService.obterTodos().subscribe({
      next: (data) => {
        this.aparelhos = data.sort((a, b) => a.id - b.id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar aparelhos', err);
        this.toastService.error(
          err.message || 'Falha ao carregar lista de aparelhos.'
        );
        this.isLoading = false;
      },
    });
    this.subscriptions.add(sub);
  }

  excluirAparelho(id: number): void {
    if (id === undefined) {
      this.toastService.warning('ID do aparelho inválido para exclusão.');
      return;
    }

    const aparelhoSelecionado = this.aparelhos.find((a) => a.id === id);
    const nomeParaExibicao = aparelhoSelecionado
      ? `${aparelhoSelecionado.nomeMarca} - ${aparelhoSelecionado.nomeModelo}`
      : `Aparelho ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Aparelho',
      message: `Tem certeza que deseja excluir o aparelho "${nomeParaExibicao}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter',
    };

    const confirmSub = this.confirmationService
      .confirm(config)
      .subscribe((confirmado) => {
        confirmSub.unsubscribe(); // ✅ Previne empilhamento de subscrições

        if (confirmado) {
          this.isLoading = true;
          const deleteSub = this.aparelhoService.remover(id).subscribe({
            next: () => {
              this.toastService.success(
                `Aparelho "${nomeParaExibicao}" excluído com sucesso!`
              );
              this.carregarListaAparelhos();
            },
            error: (err) => {
              console.error('Erro ao excluir aparelho:', err);
              this.toastService.error(
                err.message || 'Erro ao excluir aparelho.'
              );
              this.isLoading = false;
            },
          });
          this.subscriptions.add(deleteSub);
        }
      });

    this.subscriptions.add(confirmSub);
  }

  abrirModalParaCriar(): void {
    this.modalService.open(FormAparelhoComponent).then((result) => {
      if (result === 'salvo') {
        this.carregarListaAparelhos();
      }
    });
  }

  editarAparelho(id: number): void {
    this.modalService
      .open(FormAparelhoComponent, { aparelhoIdParaEditar: id })
      .then((result) => {
        if (result === 'salvo' || result === 'excluido') {
          this.carregarListaAparelhos();
        }
      });
  }

  onFormClosed(success: boolean): void {
    this.formModalInstance?.hide();
    if (success) {
      this.carregarListaAparelhos();
    }
  }
}
