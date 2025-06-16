import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModeloService } from '../../../../services/modelo.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { Modelo } from '../../../../Models/modelo.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ModalService } from '../../../../services/dialog.service';
import { FormModeloComponent } from '../form-modelo/form-modelo.component';

@Component({
  selector: 'app-list-modelo',
  standalone: true,
  imports: [CommonModule, FormsModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Modelos"
      [dados]="modelos"
      [colunas]="colunas"
      [carregando]="carregando"
      (criarNovo)="abrirModalParaCriar()"
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
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '70px' },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'nomeMarca', titulo: 'Marca', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'criadoPor', titulo: 'Criado por', tipo: 'texto' as const },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'modificadoPor', titulo: 'Modificado por', tipo: 'texto' as const },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private modeloService: ModeloService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private modalService: ModalService
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

  abrirModalParaCriar(): void {
    this.modalService.open(FormModeloComponent).then(result => {
      if (result === 'salvo') {
        this.carregarListaModelos();
      }
    });
  }

  editarModelo(id: number): void {
    this.modalService.open(FormModeloComponent, { modeloIdParaEditar: id }).then(result => {
      if (result === 'salvo' || result === 'excluido') {
        this.carregarListaModelos();
      }
    });
  }

  excluirModelo(id: number): void {
    const modelo = this.modelos.find(m => m.id === id);
    const nome = modelo?.nome || `Modelo ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o modelo "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmed => {
      if (confirmed) {
        this.carregando = true;
        const deleteSub = this.modeloService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Modelo "${nome}" excluído com sucesso!`);
            this.carregarListaModelos();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir modelo.');
            this.carregando = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });

    this.subscriptions.add(confirmSub);
  }
}
