import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  Aparelho,
  AparelhoCriacaoPayload,
} from '../../../../Models/aparelho.model';
import { Cliente } from '../../../../Models/cliente.model';
import { Marca } from '../../../../Models/marca.model';
import { Modelo } from '../../../../Models/modelo.model';

import { AparelhoService } from '../../../../services/aparelho.service';
import { ClienteService } from '../../../../services/cliente.service';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { AuditoriaData } from '../../../../Models/AuditoriaData.model';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { isInvalid } from '../../../../helpers/form-validation.helper';
import { permitirSomenteNumeros } from '../../../../helpers/form-helpers.helper';

@Component({
  selector: 'app-form-aparelho',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    RouterModule,
    FormLayoutComponent,
  ],
  templateUrl: './form-aparelho.component.html',
  styleUrls: ['./form-aparelho.component.css'],
})
export class FormAparelhoComponent implements OnInit, OnDestroy {
  @Input() clienteIdInput?: number;
  @Input() modoEmbedded = false;

  @Output() salvar = new EventEmitter<Aparelho | undefined>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<boolean>();

  private _aparelhoIdParaEditar?: number;

  @Input() set aparelhoIdParaEditar(value: number | undefined) {
    this._aparelhoIdParaEditar = value;
    if (value !== undefined && value !== null) {
      this.isEditando = true;
      this.currentAparelhoId = value;
      this.carregarAparelho(value);
    }
  }

  close!: (result?: any) => void;

  formAparelho!: FormGroup;
  isEditando = false;
  isLoading = false;
  clientes: Cliente[] = [];
  marcas: Marca[] = [];
  modelosFiltrados: Modelo[] = [];

  auditoria: AuditoriaData | null = null;
  private dataModificacaoOriginal: string | Date | null = null;
  private currentAparelhoId?: number;
  private subscriptions = new Subscription();

  private fb = inject(FormBuilder);
  private aparelhoService = inject(AparelhoService);
  private clienteService = inject(ClienteService);
  private marcaService = inject(MarcaService);
  private modeloService = inject(ModeloService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.carregarDadosDropdowns();

    if (this.clienteIdInput) {
      this.formAparelho.patchValue({ idCliente: this.clienteIdInput });
      if (this.modoEmbedded || this.isEditando) {
        this.formAparelho.get('idCliente')?.disable();
      }
    }

    if (!this.isEditando && !this.modoEmbedded) {
      this.formAparelho.get('idCliente')?.enable();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

initForm(aparelho?: Aparelho): void {
  this.formAparelho = this.fb.group({
    idCliente: [aparelho?.idCliente || null, Validators.required],
    idMarca: [aparelho?.idMarca || null, Validators.required],
    idModelo: [aparelho?.idModelo || null, Validators.required],
    imei1: [
      aparelho?.imei1 || '',
      [Validators.required, Validators.minLength(14), Validators.maxLength(15)],
    ],
    imei2: [
      aparelho?.imei2 || '',
      [Validators.required, Validators.minLength(14), Validators.maxLength(15)],
    ],
    numeroSerie: [aparelho?.numeroSerie || '', Validators.required],
    cor: [aparelho?.cor || '', Validators.required],
    descricaoAuxiliar: [
      aparelho?.descricaoAuxiliar || '',
      Validators.required,
    ],
    observacoes: [
      aparelho?.observacoes || '',
      Validators.required,
    ],
  });
}


  carregarDadosDropdowns(): void {
    let loadedCount = 0;
    const totalToLoad = this.modoEmbedded ? 2 : 2; // Apenas cliente e marca

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        this.isLoading = false;
      }
    };

    if (!this.modoEmbedded) {
      this.subscriptions.add(
        this.clienteService.obterParaSelecao().subscribe({
          next: (clientes) => {
            this.clientes = clientes;
            checkAllLoaded();
          },
          error: (err) => {
            console.error(err);
            checkAllLoaded();
          },
        })
      );
    } else {
      checkAllLoaded();
    }

    this.subscriptions.add(
      this.marcaService.obterParaSelecao().subscribe({
        next: (marcas) => {
          this.marcas = marcas;
          checkAllLoaded();
        },
        error: (err) => {
          console.error(err);
          checkAllLoaded();
        },
      })
    );
  }

  onMarcaChange(isInitialLoad: boolean = false): void {
    const marcaId = this.formAparelho.get('idMarca')?.value;
    if (marcaId) {
      this.isLoading = true;
      this.subscriptions.add(
        this.modeloService.obterPorMarca(marcaId).subscribe({
          next: (modelos) => {
            this.modelosFiltrados = modelos.map((m: any) => ({
              id: m.id,
              nome: m.descricao,
              idMarca: m.idMarca ?? marcaId,
            }));
            if (!isInitialLoad) {
              this.formAparelho.get('idModelo')?.setValue(null);
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error(err);
            this.toastService.error('Erro ao carregar modelos.');
            this.isLoading = false;
          },
        })
      );
    } else {
      this.modelosFiltrados = [];
      if (!isInitialLoad) {
        this.formAparelho.get('idModelo')?.setValue(null);
      }
    }
  }

  carregarAparelho(id: number): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.aparelhoService.obterPorId(id).subscribe({
        next: (aparelho) => {
          if (aparelho) {
            this.formAparelho.patchValue({
              idCliente: aparelho.idCliente,
              idMarca: aparelho.idMarca,
              idModelo: aparelho.idModelo,
              imei1: aparelho.imei1,
              imei2: aparelho.imei2,
              numeroSerie: aparelho.numeroSerie,
              cor: aparelho.cor,
              descricaoAuxiliar: aparelho.descricaoAuxiliar,
              observacoes: aparelho.observacoes,
            });

            this.auditoria = {
              criadoPor: aparelho.criadoPor ?? undefined,
              dataCriacao: aparelho.dataCriacao,
              modificadoPor: aparelho.modificadoPor ?? undefined,
              dataModificacao: aparelho.dataModificacao,
            };

            this.dataModificacaoOriginal = aparelho.dataModificacao || null;
            this.onMarcaChange(true);

            if (this.modoEmbedded || this.isEditando) {
              this.formAparelho.get('idCliente')?.disable();
            }
          } else {
            this.toastService.error('Aparelho não encontrado.');
            this.finalizarModal();
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Erro ao carregar aparelho.');
          this.isLoading = false;
          this.finalizarModal();
        },
      })
    );
  }

  onSubmit(): void {
    if (this.formAparelho.invalid) {
      this.formAparelho.markAllAsTouched();
      return;
    }

    const formValue = this.formAparelho.getRawValue();

    if (this.isEditando && this.currentAparelhoId) {
      this.isLoading = true;
      this.subscriptions.add(
        this.aparelhoService
          .atualizar(this.currentAparelhoId, {
            ...formValue,
            id: this.currentAparelhoId,
            dataUltimaModificacao: this.dataModificacaoOriginal,
          })
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.toastService.success('Aparelho atualizado com sucesso!');
              this.finalizarModal('salvo');
            },
            error: (err) => {
              console.error(err);
              this.isLoading = false;
            },
          })
      );
    } else {
      this.isLoading = true;
      const payload: AparelhoCriacaoPayload = {
        idCliente: formValue.idCliente,
        idMarca: formValue.idMarca,
        idModelo: formValue.idModelo,
        imei1: formValue.imei1,
        imei2: formValue.imei2 || null,
        numeroSerie: formValue.numeroSerie,
        cor: formValue.cor,
        descricaoAuxiliar: formValue.descricaoAuxiliar || null,
        observacoes: formValue.observacoes || null,
      };

      this.subscriptions.add(
        this.aparelhoService.criar(payload).subscribe({
          next: () => {
            this.isLoading = false;
            this.toastService.success('Aparelho cadastrado com sucesso!');
            this.finalizarModal('salvo');
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
          },
        })
      );
    }
  }

  onHandleCancelar(): void {
    this.finalizarModal('cancelado');
  }

  onExcluir(): void {
    if (!this.currentAparelhoId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir este aparelho?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar',
    };

    this.subscriptions.add(
      this.confirmationService.confirm(config).subscribe((confirmed) => {
        if (confirmed) {
          this.isLoading = true;
          this.subscriptions.add(
            this.aparelhoService.remover(this.currentAparelhoId!).subscribe({
              next: () => {
                this.isLoading = false;
                this.toastService.success('Aparelho excluído com sucesso!');
                this.finalizarModal('excluido');
              },
              error: (err) => {
                console.error(err);
                this.isLoading = false;
              },
            })
          );
        }
      })
    );
  }

  private finalizarModal(result?: any) {
    if (this.close) {
      this.close(result);
    }
  }

  get cardTitle(): string {
    return this.isEditando
      ? 'Editar Aparelho'
      : this.modoEmbedded
      ? 'Adicionar Aparelho'
      : 'Cadastrar Novo Aparelho';
  }

  get aparelhoIdParaEditar(): number | undefined {
    return this._aparelhoIdParaEditar;
  }

  isInvalid(controlName: string): boolean {
    return isInvalid(this.formAparelho, controlName);
  }

 onKeyPressSomenteNumeros(event: KeyboardEvent): void {
  permitirSomenteNumeros(event);
}

}
