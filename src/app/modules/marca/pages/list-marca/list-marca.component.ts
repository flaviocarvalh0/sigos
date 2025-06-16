import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { Marca } from '../../../../Models/marca.model';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { CommonModule } from '@angular/common';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ModalService } from '../../../../services/dialog.service';
import { FormMarcaComponent } from '../form-marca/form-marca.component';

@Component({
  selector: 'app-list-marca',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Marcas"
      [dados]="marcas"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="abrirModalParaCriar()"
      (editar)="editarMarca($event)"
      (excluir)="excluirMarca($event)">
    </app-listagem-dinamica>
  `,
  styleUrls: ['./list-marca.component.css']
})
export class ListMarcaComponent implements OnInit, OnDestroy {
  marcas: Marca[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '80px' },
    { campo: 'nome', titulo: 'Nome da Marca', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'criadoPor', titulo: 'Criado por', tipo: 'texto' as const, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'dataHora' as const, ordenavel: true },
    { campo: 'modificadoPor', titulo: 'Modificado por', tipo: 'texto' as const, filtro: true },
    { campo: 'dataModificacao', titulo: 'Atualizado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private marcaService: MarcaService,
    private toast: ToastService,
    private confirmation: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.carregarMarcas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarMarcas(): void {
    this.isLoading = true;
    const sub = this.marcaService.obterTodos().subscribe({
      next: (data) => {
        this.marcas = data;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Erro ao carregar marcas.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  abrirModalParaCriar(): void {
    this.modalService.open(FormMarcaComponent).then(result => {
      if (result === 'salvo') {
        this.carregarMarcas();
      }
    });
  }

  editarMarca(id: number): void {
    this.modalService.open(FormMarcaComponent, {
      marcaIdParaEditar: id
    }).then(result => {
      if (result === 'salvo' || result === 'excluido') {
        this.carregarMarcas();
      }
    });
  }

  excluirMarca(id: number): void {
    const marca = this.marcas.find(m => m.id === id);
    const nome = marca?.nome || `Marca ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a marca "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmation.confirm(config).subscribe(confirmed => {
      confirmSub.unsubscribe();

      if (!confirmed) return;

      this.isLoading = true;
      const deleteSub = this.marcaService.remover(id).subscribe({
        next: () => {
          this.toast.success(`Marca "${nome}" excluída com sucesso!`);
          this.carregarMarcas();
        },
        error: (err) => {
          if (err.message?.includes('404') || err.message?.toLowerCase().includes('não encontrada')) {
            this.toast.warning(`Marca "${nome}" já foi excluída ou não existe.`);
          } else if (err.message?.includes('constraint') || err.message?.includes('relacionada')) {
            this.toast.error(`A marca "${nome}" não pode ser excluída pois está relacionada a outros registros.`);
          } else {
            this.toast.error(err.message || `Erro ao remover marca "${nome}".`);
          }
          this.isLoading = false;
        }
      });
      this.subscriptions.add(deleteSub);
    });

    this.subscriptions.add(confirmSub);
  }
}
