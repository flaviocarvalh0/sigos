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

@Component({
  selector: 'app-form-marca',
  templateUrl: './form-marca.component.html',
  styleUrls: ['./form-marca.component.css'], // Corrigido para styleUrls
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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

  onSubmit(): void { // Renomeado de 'salvar'
    if (this.formMarca.invalid) {
      this.formMarca.markAllAsTouched();
      this.toastService.warning('Formulário inválido. Verifique o campo Nome.');
      return;
    }

    const formValue = this.formMarca.value;

    if (this.isEditando && this.currentMarcaId) {
      this.isLoading = true;
      const checkAndUpdateSub = this.marcaService.obterPorId(this.currentMarcaId).pipe(
        switchMap(marcaAtualDoBanco => {
          if (!marcaAtualDoBanco) {
            this.toastService.error('Marca não encontrada no servidor. Pode ter sido excluída.');
            this.router.navigate(['/marca']);
            return EMPTY;
          }
          const dataModificacaoAtualBanco = marcaAtualDoBanco.dataModificacao || null;
          const originalTimestamp = this.dataModificacaoOriginal ? new Date(this.dataModificacaoOriginal).getTime() : null;
          const atualBancoTimestamp = dataModificacaoAtualBanco ? new Date(dataModificacaoAtualBanco).getTime() : null;

          if (originalTimestamp && atualBancoTimestamp && originalTimestamp !== atualBancoTimestamp) {
            return of({ error: 'concurrency', marcaDoBanco: marcaAtualDoBanco });
          }

          const payload: MarcaAtualizacaoPayload = {
            id: this.currentMarcaId!,
            nome: formValue.nome,
            dataUltimaModificacao: this.dataModificacaoOriginal
          };
          return this.marcaService.atualizar(this.currentMarcaId!, payload);
        }),
        tap(() => this.isLoading = false),
        catchError(err => { this.isLoading = false; return of(err); })
      ).subscribe({
        next: (response: Marca | { error: string, marcaDoBanco?: Marca }) => {
          if ((response as { error: string })?.error === 'concurrency') {
            const marcaDoBanco = (response as { error: string, marcaDoBanco: Marca }).marcaDoBanco;
            this.toastService.warning('Esta marca foi alterada. Seus dados não foram salvos. O formulário foi atualizado.');
            if (marcaDoBanco) {
              this.dataModificacaoOriginal = marcaDoBanco.dataModificacao || null;
              this.formMarca.patchValue(marcaDoBanco);
            }
            return;
          }
          const marcaAtualizada = response as Marca;
          if (marcaAtualizada && marcaAtualizada.id) {
            this.toastService.success('Marca atualizada com sucesso!');
            this.dataModificacaoOriginal = marcaAtualizada.dataModificacao || null;
            this.router.navigate(['/marca']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err.error !== 'concurrency') {
            this.toastService.error(err.message || 'Erro ao atualizar marca.');
            console.error('Erro ao atualizar marca:', err);
          }
        }
      });
      this.subscriptions.add(checkAndUpdateSub);
    } else { // Criando nova marca
      this.isLoading = true;
      const payload: MarcaCriacaoPayload = {
        nome: formValue.nome
      };
      const createSub = this.marcaService.criar(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.success('Marca criada com sucesso!');
          this.router.navigate(['/marca']);
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Erro ao criar marca.');
          console.error('Erro ao criar marca:', err);
        }
      });
      this.subscriptions.add(createSub);
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