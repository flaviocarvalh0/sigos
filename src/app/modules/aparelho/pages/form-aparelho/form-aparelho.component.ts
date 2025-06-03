import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, inject } from '@angular/core'; // Adicionado OnDestroy, inject
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Adicionado RouterModule
import { Subscription, of, EMPTY } from 'rxjs'; // Adicionado Subscription, of, EMPTY
import { switchMap, tap, catchError } from 'rxjs/operators'; // Adicionado tap, catchError

import { Aparelho, AparelhoCriacaoPayload, AparelhoAtualizacaoPayload } from '../../../../Models/aparelho.model';
import { Cliente } from '../../../../Models/cliente.model';
import { Marca } from '../../../../Models/marca.model'; // Assumindo que você tem este modelo
import { Modelo } from '../../../../Models/modelo.model'; // Assumindo que você tem este modelo

import { AparelhoService } from '../../../../services/aparelho.service';
import { ClienteService } from '../../../../services/cliente.service';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';


@Component({
  selector: 'app-form-aparelho',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, RouterModule], // Adicionado RouterModule se houver links
  templateUrl: './form-aparelho.component.html',
  styleUrls: ['./form-aparelho.component.css']
})
export class FormAparelhoComponent implements OnInit, OnDestroy {
  @Input() clienteIdInput?: number; // Renomeado para clareza, usado para @Input
  @Input() modoEmbedded = false;
  @Input() aparelhoIdParaEditar?: number;
  @Output() salvar = new EventEmitter<Aparelho | undefined>();
  @Output() cancelar = new EventEmitter<void>();

  formAparelho!: FormGroup; // Será inicializado no initForm
  isEditando = false;
  isLoading = false; // Para feedback de carregamento
  clientes: Cliente[] = [];
  marcas: Marca[] = [];
  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  
  private dataModificacaoOriginal: string | Date | null = null;
  private currentAparelhoId?: number; // Unifica ID de edição
  private subscriptions = new Subscription();

  // Injeção de dependências moderna com inject() ou manter no construtor
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
    this.initForm(); // Inicializa a estrutura do formulário
  }

  ngOnInit(): void {
    this.isLoading = true; // Começa carregando
    this.carregarDadosDropdowns();

    // Determinar o ID do cliente
    let clienteIdParaForm = this.clienteIdInput;

    // Determinar se estamos editando e qual o ID do aparelho
    if (this.aparelhoIdParaEditar) { // Prioridade para @Input de ID de aparelho
      this.isEditando = true;
      this.currentAparelhoId = this.aparelhoIdParaEditar;
      this.carregarAparelho(this.currentAparelhoId);
    } else if (!this.modoEmbedded) { // Se não for embedded e não tiver ID de aparelho por Input, checa a rota
      const routeSub = this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        const routeClienteIdParam = params.get('clienteId');

        if (idParam) {
          this.isEditando = true;
          this.currentAparelhoId = +idParam;
          this.carregarAparelho(this.currentAparelhoId);
        }
        if (routeClienteIdParam && !clienteIdParaForm) { // Se clienteId veio da rota e não por @Input
          clienteIdParaForm = +routeClienteIdParam;
        }
      });
      this.subscriptions.add(routeSub);
    }

    if (clienteIdParaForm) {
      this.formAparelho.patchValue({ idCliente: clienteIdParaForm });
      if (this.modoEmbedded || this.isEditando) { // Desabilita cliente se embedded ou editando (cliente do aparelho não muda)
        this.formAparelho.get('idCliente')?.disable();
      }
    }
     // Se não estiver editando e não for modo embedded, habilita o campo cliente.
     if (!this.isEditando && !this.modoEmbedded && !this.formAparelho.get('idCliente')?.value) {
        this.formAparelho.get('idCliente')?.enable();
    }


    // Se após todas as verificações ainda não estiver editando, garante que isLoading seja false (caso dropdowns carreguem rápido)
    if (!this.isEditando && !this.aparelhoIdParaEditar) {
        // Se apenas os dropdowns precisarem carregar:
        // O isLoading será tratado pelo carregarDadosDropdowns e carregarAparelho
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initForm(aparelho?: Aparelho): void {
    this.formAparelho = this.fb.group({
      // Nomes dos campos em camelCase para corresponder aos modelos e DTOs
      idCliente: [aparelho?.idCliente || null, Validators.required],
      idMarca: [aparelho?.idMarca || null, Validators.required],
      idModelo: [aparelho?.idModelo || null, Validators.required],
      imei1: [aparelho?.imei1 || '', [Validators.required, Validators.minLength(14), Validators.maxLength(15)]],
      imei2: [aparelho?.imei2 || '', [Validators.minLength(14), Validators.maxLength(15)]],
      numeroSerie: [aparelho?.numeroSerie || '', Validators.required], // Adicionado
      cor: [aparelho?.cor || '', Validators.required],
      descricaoAuxiliar: [aparelho?.descricaoAuxiliar || ''], // Adicionado
      observacoes: [aparelho?.observacoes || '']
      // dataModificacao não é um campo do form, mas é usado para concorrência
    });

    // Se estiver editando um aparelho, o campo cliente geralmente é desabilitado.
     if (this.isEditando && aparelho) {
        this.formAparelho.get('idCliente')?.disable();
    } else if (this.modoEmbedded && this.clienteIdInput) {
        this.formAparelho.get('idCliente')?.disable();
        this.formAparelho.patchValue({ idCliente: this.clienteIdInput }, { emitEvent: false });
    }

    // Filtra modelos se já houver uma marca (caso de edição)
    if (aparelho?.idMarca) {
        this.onMarcaChange(true); // Passa true para não resetar o modelo ao carregar
    }
  }

  carregarDadosDropdowns(): void {
    let loadedCount = 0;
    const totalToLoad = this.modoEmbedded ? 2 : 3; // Marcas, Modelos (+ Clientes se não embedded)

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        if(!this.isEditando) this.isLoading = false; // Só desliga se não estiver esperando carregarAparelho
      }
    };

    if (!this.modoEmbedded) {
      this.subscriptions.add(
        this.clienteService.obterTodos().subscribe({
          next: clientes => { this.clientes = clientes; checkAllLoaded(); },
          error: err => { this.toastService.error('Erro ao carregar clientes.'); console.error(err); checkAllLoaded(); }
        })
      );
    } else {
        checkAllLoaded(); // Simula o carregamento de clientes para a contagem
    }

    this.subscriptions.add(
      this.marcaService.getMarcas().subscribe({ // Assumindo que getMarcas existe e retorna Marca[]
        next: marcas => { this.marcas = marcas; checkAllLoaded(); },
        error: err => { this.toastService.error('Erro ao carregar marcas.'); console.error(err); checkAllLoaded(); }
      })
    );

    this.subscriptions.add(
      this.modeloService.getModelos().subscribe({ // Assumindo que getModelos existe e retorna Modelo[]
        next: modelos => { this.modelos = modelos; checkAllLoaded(); },
        error: err => { this.toastService.error('Erro ao carregar modelos.'); console.error(err); checkAllLoaded(); }
      })
    );
  }

  onMarcaChange(isInitialLoad: boolean = false): void {
    const marcaId = this.formAparelho.get('idMarca')?.value;
    if (marcaId) {
      // Idealmente, o serviço de modelo deveria ter um método para buscar por marcaId.
      // Se não, filtramos a lista completa de modelos.
      this.modelosFiltrados = this.modelos.filter(m => m.id_marca === marcaId); // Assumindo que Modelo tem idMarca
      if (!isInitialLoad) {
          this.formAparelho.get('idModelo')?.setValue(null); // Resetar modelo se não for carga inicial
      }
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
        next: aparelho => {
          if (aparelho) {
            this.dataModificacaoOriginal = aparelho.dataModificacao || null;
            // A chamada a initForm ou patchValue deve ser cuidadosa aqui
            // this.initForm(aparelho) recria o form, o que pode perder subscriptions.
            // Melhor usar patchValue e configurar o que for necessário.
            
            this.formAparelho.patchValue({
                idCliente: aparelho.idCliente,
                idMarca: aparelho.idMarca,
                // idModelo será setado após onMarcaChange ser chamado explicitamente
                imei1: aparelho.imei1,
                imei2: aparelho.imei2,
                numeroSerie: aparelho.numeroSerie,
                cor: aparelho.cor,
                descricaoAuxiliar: aparelho.descricaoAuxiliar,
                observacoes: aparelho.observacoes
            });
            // Após setar a marca, chamar onMarcaChange para popular modelosFiltrados
            // e então setar o modelo.
            this.onMarcaChange(true); // true para indicar que é carga inicial e não deve resetar idModelo se já foi patchado
            this.formAparelho.get('idModelo')?.patchValue(aparelho.idModelo); // Setar o modelo após filtrar

            if (this.modoEmbedded || this.isEditando) {
                this.formAparelho.get('idCliente')?.disable();
            }

          } else {
            this.toastService.error('Aparelho não encontrado.');
            if (!this.modoEmbedded) this.router.navigate(['/aparelho']); // Rota para lista de aparelhos
          }
          this.isLoading = false;
        },
        error: err => {
          this.toastService.error('Erro ao carregar aparelho.');
          console.error(err);
          this.isLoading = false;
        }
      })
    );
  }

  onSubmit(): void {
    if (this.formAparelho.invalid) {
      this.formAparelho.markAllAsTouched();
      this.toastService.warning('Formulário inválido. Verifique os campos.');
      return;
    }

    const formValue = this.formAparelho.getRawValue(); // getRawValue para pegar idCliente desabilitado

    if (this.isEditando && this.currentAparelhoId) {
      this.isLoading = true;
      this.subscriptions.add(
        this.aparelhoService.obterPorId(this.currentAparelhoId).pipe(
          switchMap(aparelhoAtualDoBanco => {
            if (!aparelhoAtualDoBanco) {
              this.toastService.error('Aparelho não encontrado no servidor.');
              return EMPTY;
            }
            const dataModificacaoAtualBanco = aparelhoAtualDoBanco.dataModificacao || null;
            const originalTimestamp = this.dataModificacaoOriginal ? new Date(this.dataModificacaoOriginal).getTime() : null;
            const atualBancoTimestamp = dataModificacaoAtualBanco ? new Date(dataModificacaoAtualBanco).getTime() : null;

            if (originalTimestamp && atualBancoTimestamp && originalTimestamp !== atualBancoTimestamp) {
              return of({ error: 'concurrency', aparelhoDoBanco: aparelhoAtualDoBanco });
            }

            const payload: AparelhoAtualizacaoPayload = {
              id: this.currentAparelhoId!,
              idCliente: formValue.idCliente,
              idMarca: formValue.idMarca,
              idModelo: formValue.idModelo,
              imei1: formValue.imei1,
              imei2: formValue.imei2 || null,
              numeroSerie: formValue.numeroSerie,
              cor: formValue.cor,
              descricaoAuxiliar: formValue.descricaoAuxiliar || null,
              observacoes: formValue.observacoes || null,
              dataUltimaModificacao: this.dataModificacaoOriginal
            };
            return this.aparelhoService.atualizar(this.currentAparelhoId!, payload);
          }),
          tap(() => this.isLoading = false),
          catchError(err => { this.isLoading = false; return of(err); })
        ).subscribe({
          next: (response: Aparelho | { error: string, aparelhoDoBanco?: Aparelho }) => {
            if ((response as { error: string })?.error === 'concurrency') {
              const aparelhoDoBanco = (response as { error: string, aparelhoDoBanco: Aparelho }).aparelhoDoBanco;
              this.toastService.warning('Este aparelho foi alterado. Seus dados não foram salvos. O formulário foi atualizado.');
              if(aparelhoDoBanco) {
                this.dataModificacaoOriginal = aparelhoDoBanco.dataModificacao || null;
                this.formAparelho.patchValue(aparelhoDoBanco); // Repopula
                this.onMarcaChange(true); // Re-filtra modelos
                this.formAparelho.get('idModelo')?.patchValue(aparelhoDoBanco.idModelo);
              }
              return;
            }
            const aparelhoAtualizado = response as Aparelho;
            if (aparelhoAtualizado && aparelhoAtualizado.id) {
              this.toastService.success('Aparelho atualizado com sucesso!');
              this.dataModificacaoOriginal = aparelhoAtualizado.dataModificacao || null;
              this.salvar.emit(aparelhoAtualizado);
              if (!this.modoEmbedded) {
                this.router.navigate(['/aparelho']); // Ou para detalhes do cliente se fizer mais sentido
              }
            }
          },
          error: err => { /* this.isLoading já false pelo catchError */ this.toastService.error(err.message || 'Erro ao atualizar aparelho.'); console.error(err); }
        })
      );
    } else { // Criando novo aparelho
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
          next: aparelhoCriado => {
            this.isLoading = false;
            this.toastService.success('Aparelho cadastrado com sucesso!');
            this.salvar.emit(aparelhoCriado);
            if (!this.modoEmbedded) {
               // Se tem idCliente, volta para o form do cliente, aba aparelhos. Senão, lista de aparelhos.
                if (aparelhoCriado.idCliente) {
                    this.router.navigate(['/cliente/form', aparelhoCriado.idCliente], { queryParams: { aba: 'aparelhos' } });
                } else {
                    this.router.navigate(['/aparelho']);
                }
            } else {
                this.formAparelho.reset(); // Limpa o form no modo embedded para poder adicionar outro
                if(this.clienteIdInput) this.formAparelho.patchValue({idCliente: this.clienteIdInput}); // Repõe clienteId
            }
          },
          error: err => { this.isLoading = false; this.toastService.error(err.message || 'Erro ao cadastrar aparelho.'); console.error(err); }
        })
      );
    }
  }

  onHandleCancelar(): void { // Renomeado para evitar conflito com @Output() cancelar
    if (this.modoEmbedded) {
      this.cancelar.emit();
    } else {
      // Tenta voltar para o cliente se o ID estiver no form, senão para a lista de aparelhos
      const idClienteDoForm = this.formAparelho.get('idCliente')?.value;
      if (idClienteDoForm) {
        this.router.navigate(['/cliente/form', idClienteDoForm], { queryParams: { aba: 'aparelhos' } });
      } else if (this.clienteIdInput){
        this.router.navigate(['/cliente/form', this.clienteIdInput], { queryParams: { aba: 'aparelhos' } });
      }
      else {
        this.router.navigate(['/aparelho']); // Rota para a lista de aparelhos
      }
    }
  }

  onExcluir(): void {
    if (!this.currentAparelhoId) return;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir este aparelho? (ID: ${this.currentAparelhoId})`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    this.subscriptions.add(
      this.confirmationService.confirm(config).subscribe(confirmed => {
        if (confirmed) {
          this.isLoading = true;
          this.subscriptions.add(
            this.aparelhoService.remover(this.currentAparelhoId!).subscribe({
              next: () => {
                this.isLoading = false;
                this.toastService.success('Aparelho excluído com sucesso!');
                this.salvar.emit(undefined); // Emite undefined para indicar exclusão
                if (!this.modoEmbedded) {
                  const idClienteDoForm = this.formAparelho.get('idCliente')?.value;
                  if (idClienteDoForm) {
                    this.router.navigate(['/cliente/form', idClienteDoForm], { queryParams: { aba: 'aparelhos' } });
                  } else {
                    this.router.navigate(['/aparelho']);
                  }
                }
              },
              error: err => { this.isLoading = false; this.toastService.error(err.message || 'Erro ao excluir aparelho.'); console.error(err); }
            })
          );
        }
      })
    );
  }
  
  // Getters para o template (se precisar de títulos dinâmicos como em FormCliente)
  get cardTitle(): string {
    return this.isEditando ? 'Editar Aparelho' : (this.modoEmbedded ? 'Adicionar Aparelho' : 'Cadastrar Novo Aparelho');
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Aparelho' : 'Salvar Aparelho';
  }
}