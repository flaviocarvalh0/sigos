// src/app/features/marca/pages/form-marca/form-marca.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // NgIf já está em CommonModule
import { Subscription, of, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

import { Marca, MarcaCriacaoPayload, MarcaAtualizacaoPayload } from '../../../../Models/marca.model'; // Ajuste o path
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path
import { FormularioDinamicoComponent, FormularioDinamicoConfig } from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';

@Component({
  selector: 'app-form-marca',
  template: `<app-form-dinamico
  [config]="formularioConfig"
  [data]="dadosIniciais"
  [isLoading]="isLoading"
  [isEditando]="isEditando"
  (salvar)="onSubmit($event)"
  (cancelar)="onCancelar()"
  (excluir)="onExcluir()">
</app-form-dinamico>
`,
  styleUrls: ['./form-marca.component.css'], // Corrigido para styleUrls
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormularioDinamicoComponent],
})
export class FormMarcaComponent implements OnInit, OnDestroy {
  // Injeções
  private fb = inject(FormBuilder);
  private marcaService = inject(MarcaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  formMarca!: FormGroup; // Renomeado de 'form'
  currentMarcaId: number | null = null; // Renomeado de 'id'
  isEditando = false;
  isLoading = false;
  private dataModificacaoOriginal: string | Date | null = null;
  private subscriptions = new Subscription();
  dadosIniciais: any = {};

  formularioConfig: FormularioDinamicoConfig = {
  titulo: this.isEditando ? 'Editar Marca' : 'Cadastrar Marca',
  iconeTitulo: 'bi bi-tags',
  botoes: {
    salvarTexto: this.isEditando ? 'Atualizar Marca' : 'Salvar Marca',
    cancelarTexto: 'Cancelar',
    excluirTexto: 'Excluir',
    excluir: this.isEditando
  },
  abas: [
    {
      titulo: '',
      campos: [
        {
          nome: 'nome',
          tipo: 'text',
          rotulo: 'Nome da Marca',
          placeholder: 'Digite o nome da marca',
          obrigatorio: true,
          col: 'col-md-12',
          mensagensErro: {
            required: 'O nome da marca é obrigatório.'
          }
        }
      ]
    }
  ]
};


  constructor() {
    this.initForm(); // Inicializa a estrutura do formulário
  }

  ngOnInit(): void {
    this.isLoading = true;
    const routeSub = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.currentMarcaId = +idParam;
        this.isEditando = true;
        this.carregarMarca(this.currentMarcaId);
      } else {
        this.isEditando = false;
        // initForm() já foi chamado no construtor,
        // apenas garantimos estado limpo para nova marca.
        // Se houver defaults específicos para nova marca, adicionar aqui com patchValue
        this.isLoading = false;
      }
    });
    this.subscriptions.add(routeSub);

    this.formularioConfig = {
      ...this.formularioConfig,
      titulo: this.cardTitle,
      botoes: {
        ...this.formularioConfig.botoes,
        salvarTexto: this.saveButtonText,
        excluir: this.isEditando,
      },
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initForm(marca?: Marca): void {
    this.formMarca = this.fb.group({
      nome: [marca?.nome || '', [
        Validators.required,
        Validators.minLength(3), // Conforme DTO C#
        Validators.maxLength(100) // Conforme DTO C#
      ]],
      // id_usuario_criador e id_usuario_modificador são tratados pelo backend
    });
  }

  carregarMarca(id: number): void {
    this.isLoading = true;
    const marcaSub = this.marcaService.obterPorId(id).subscribe({
      next: (marca: Marca | undefined) => {
        if (marca) {
          this.dadosIniciais = {
            nome: marca.nome
          };

          this.dataModificacaoOriginal = marca.dataModificacao || null;
          // this.initForm(marca); // Recriar pode ser problemático, usar patchValue
          this.formMarca.patchValue({
            nome: marca.nome
          });
        } else {
          this.toastService.error('Marca não encontrada.');
          this.router.navigate(['/marca']); // Navega para a lista
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar marca:', err);
        this.toastService.error(err.message || 'Erro ao carregar dados da marca.');
        this.isLoading = false;
        this.router.navigate(['/marca']);
      }
    });
    this.subscriptions.add(marcaSub);
  }

  onSubmit(dados: any): void {
  if (!dados.nome || dados.nome.trim().length < 3) {
    this.toastService.warning('Nome da marca inválido.');
    return;
  }

  if (this.isEditando && this.currentMarcaId) {
    this.isLoading = true;

    const sub = this.marcaService.obterPorId(this.currentMarcaId).pipe(
      switchMap(marcaDoBanco => {
        if (!marcaDoBanco) {
          this.toastService.error('Marca não encontrada no servidor. Pode ter sido excluída.');
          this.router.navigate(['/marca']);
          return EMPTY;
        }

        const timestampBanco = new Date(marcaDoBanco.dataModificacao || '').getTime();
        const timestampLocal = this.dataModificacaoOriginal ? new Date(this.dataModificacaoOriginal).getTime() : null;

        if (timestampBanco !== timestampLocal) {
          return of({ error: 'concurrency', marcaDoBanco: marcaDoBanco });
        }

        const payload: MarcaAtualizacaoPayload = {
          id: this.currentMarcaId!,
          nome: dados.nome,
          dataUltimaModificacao: this.dataModificacaoOriginal
        };
        return this.marcaService.atualizar(this.currentMarcaId!, payload);
      }),
      tap(() => this.isLoading = false),
      catchError(err => { this.isLoading = false; return of(err); })
    ).subscribe({
      next: (response: Marca | { error: string, marcaDoBanco?: Marca }) => {
        if ((response as any).error === 'concurrency') {
          const marcaDoBanco = (response as any).marcaDoBanco;
          this.toastService.warning('Esta marca foi alterada. Seus dados não foram salvos. O formulário foi atualizado.');
          if (marcaDoBanco) {
            this.dataModificacaoOriginal = marcaDoBanco.dataModificacao;
          }
          return;
        }

        this.toastService.success('Marca atualizada com sucesso!');
        this.router.navigate(['/marca']);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao atualizar marca.');
        console.error('Erro ao atualizar marca:', err);
      }
    });

    this.subscriptions.add(sub);
  } else {
    // Criando nova marca
    this.isLoading = true;
    const payload: MarcaCriacaoPayload = {
      nome: dados.nome
    };

    const sub = this.marcaService.criar(payload).subscribe({
      next: () => {
        this.toastService.success('Marca criada com sucesso!');
        this.router.navigate(['/marca']);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Erro ao criar marca.');
        this.isLoading = false;
        console.error('Erro ao criar marca:', err);
      }
    });

    this.subscriptions.add(sub);
  }
}


  onCancelar(): void { // Renomeado de 'cancelar'
    this.router.navigate(['/marca']);
  }

  onExcluir(): void { // Renomeado de 'excluir'
    if (!this.currentMarcaId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a marca "${this.formMarca.get('nome')?.value || 'ID: ' + this.currentMarcaId}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        const deleteSub = this.marcaService.remover(this.currentMarcaId!).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.success('Marca excluída com sucesso!');
            this.router.navigate(['/marca']);
          },
          error: (err) => {
            this.isLoading = false;
            this.toastService.error(err.message || 'Erro ao excluir marca.');
            console.error('Erro ao excluir marca:', err);
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }

  // Getters para o template
  public isInvalidControl(controlName: string): boolean {
    const control = this.formMarca.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  public getControlErrors(controlName: string): any {
    const control = this.formMarca.get(controlName);
    return control ? control.errors : null;
  }

  get cardTitle(): string {
    return this.isEditando ? 'Editar Marca' : 'Cadastrar Nova Marca';
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Marca' : 'Salvar Marca';
  }
  // Método exibirToast e @ViewChild('toast') foram removidos
}
