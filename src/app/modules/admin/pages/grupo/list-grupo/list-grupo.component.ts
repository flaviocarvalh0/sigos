import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router'; // Router não precisa estar no imports de standalone se já estiver em RouterModule
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common'; // Necessário para *ngIf, etc. no template se não for inline
import { ListagemDinamicaComponent } from '../../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { Grupo } from '../../../../../Models/usuario.model';
import { GrupoService } from '../../../../../services/grupo.service';
import { ToastService } from '../../../../../services/toast.service';
import { ConfirmationService } from '../../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../../Models/confirmation.model';


@Component({
  selector: 'app-list-grupos',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent], // ListagemDinamicaComponent é usado no template
  template: `
    <app-listagem-dinamica
      titulo="Gerenciamento de Grupos de Usuários"
      [dados]="grupos"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaFormulario()"
      (editar)="onEditar($event)"
      (excluir)="onRemover($event)">
      </app-listagem-dinamica>
  `,
  styleUrls: ['./list-grupo.component.css'] // Pode manter ou remover se não houver estilos
})
export class ListGruposComponent implements OnInit, OnDestroy {
  grupos: Grupo[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  // Definição das colunas para o ListagemDinamicaComponent
  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '80px' },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'ativo', titulo: 'Ativo', tipo: 'boolean' as const, ordenavel: true, filtro: false },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Atualizado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private grupoService: GrupoService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarGrupos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarGrupos(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.grupoService.obterTodos().subscribe(
        (grupos: Grupo[]) => {
          this.grupos = grupos || [];
          this.isLoading = false;
        },
        (err) => {
          this.toastService.error('Falha ao buscar grupos da API.');
          console.error(err);
          this.isLoading = false;
          this.grupos = [];
        }
      )
    );
  }

  // Chamado pelo evento (criarNovo) do ListagemDinamicaComponent
  navegarParaFormulario(id?: number): void { // Mantido para consistência, mas o evento (criarNovo) não passa ID
    const rota = id ? ['/admin/grupo/form/', id] : ['/admin/grupo/form'];
    this.router.navigate(rota, { queryParams: { returnUrl: '/admin/grupos' } });
  }

  onEditar(item: any): void {
    const id = typeof item === 'number' ? item : item?.id;
    if (id == null) {
        console.error('Tentativa de editar com ID nulo:', item);
        this.toastService.error('Não foi possível identificar o grupo para edição.');
        return;
    }
    this.router.navigate(['/admin/grupo/form', id], { queryParams: { returnUrl: '/admin/grupos' } });
  }

  // Chamado pelo evento (excluir) do ListagemDinamicaComponent
  // Assumindo que o evento $event é o objeto Grupo ou tem uma propriedade id e nome
  onRemover(item: any): void { // Pode ser 'item: Grupo'
    const id = typeof item === 'number' ? item : item?.id;
    const nome = item?.nome || `Grupo ID ${id}`;

    if (id == null) {
        console.error('Tentativa de remover com ID nulo:', item);
        this.toastService.error('Não foi possível identificar o grupo para remoção.');
        return;
    }

    const configConfirm: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja remover o grupo "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Remover',
      acceptButtonClass: 'btn-danger', // Classe para o botão de confirmação
      cancelButtonText: 'Cancelar'
    };

    this.subscriptions.add(
      this.confirmationService.confirm(configConfirm).subscribe((confirmado: any) => {
        if (confirmado) {
          this.isLoading = true; // Pode ser um isLoading específico para a linha, se o componente suportar
          this.subscriptions.add(
            this.grupoService.remover(id).subscribe(
              () => {
                this.toastService.success(`Grupo "${nome}" removido com sucesso!`);
                this.carregarGrupos(); // Recarrega a lista
                this.isLoading = false;
              },
              (err) => {
                // Tratamento de erro similar ao ListCategoriaComponent
                const msgErro = err.error?.mensagem || err.message || `Erro desconhecido ao remover grupo "${nome}".`;
                 if (msgErro.includes('constraint') || msgErro.includes('relacionad')) { // Verifica por palavras chave comuns
                     this.toastService.error(`O grupo "${nome}" não pode ser excluído pois está relacionado a outros registros.`);
                 } else {
                     this.toastService.error(msgErro);
                 }
                console.error(err);
                this.isLoading = false;
              }
            )
          );
        }
      })
    );
  }
}
