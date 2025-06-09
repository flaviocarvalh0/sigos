import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ClienteService } from '../../../../services/cliente.service';
import {
  Cliente,
  ClienteCriacaoPayload,
  ClienteAtualizacaoPayload,
} from '../../../../Models/cliente.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormAparelhoComponent } from '../../../aparelho/pages/form-aparelho/form-aparelho.component';
import { AparelhoService } from '../../../../services/aparelho.service';
import { Aparelho } from '../../../../Models/aparelho.model';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { Marca } from '../../../../Models/marca.model';
import { Modelo } from '../../../../Models/modelo.model';
import { catchError, EMPTY, of, Subscription, switchMap, tap } from 'rxjs';
import { ToastService } from '../../../../services/toast.service'; // Ajuste o path se necessário
import { ConfirmationService } from '../../../../services/confirmation.service'; // Ajuste o path se necessário
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path se necessário
import {
  cnpjValidator,
  cpfValidator,
} from '../../../../shared/validators/document.validators';

declare const bootstrap: any;

@Component({
  selector: 'app-form-cliente',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormAparelhoComponent,
    RouterModule,
    HttpClientModule,
  ],
  standalone: true,
  templateUrl: './form-cliente.component.html',
  styleUrls: ['./form-cliente.component.css'],
})
export class FormClienteComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isModal: boolean = false;
  @Output() clienteSalvo = new EventEmitter<Cliente | undefined>();

  private dataModificacaoOriginal?: Date;

  private fb = inject(FormBuilder);
  isEditando = false;
  clienteId: number | undefined;
  form!: FormGroup;
  isLoading = false;
  loadingCep = false;
  cepError = '';
  aparelhoService: AparelhoService = inject(AparelhoService);
  aparelhos: Aparelho[] = [];
  marcas: Marca[] = [];
  modelos: Modelo[] = [];
  private carregouMarcas = false;
  private carregouModelos = false;

  abaSelecionada = 'dados';
  @ViewChild('modalFormAparelhoRef') modalFormAparelhoRef!: ElementRef;
  private modalAparelhoInstance: any;
  exibirConteudoModalAparelho = false;
  editandoAparelhoId: number | undefined = undefined;

  private subscriptions = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private router: Router,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private toastService: ToastService, // Injetado
    private confirmationService: ConfirmationService // Injetado
  ) {}

  ngOnInit(): void {
    // initForm será chamado dentro de carregarCliente ou no else
    if (!this.isModal) {
      const routeSub = this.route.paramMap.subscribe((params) => {
        const idParam = params.get('id');
        if (idParam) {
          this.clienteId = +idParam;
          this.isEditando = true;
          this.carregarCliente(this.clienteId); // initForm é chamado aqui dentro
          this.carregarAparelhosDoCliente(this.clienteId);
          this.carregarMarcas();
          this.carregarModelos();
        } else {
          this.isEditando = false;
          this.initForm(); // Inicializa form para novo cliente
          this.form.patchValue({
            ativo: true,
            pais: 'Brasil',
            tipoPessoa: 'Física',
          });
          // Chama setupConditionalDocumentValidation após patchValue para novo cliente
          this.setupConditionalDocumentValidation(
            this.form.get('tipoPessoa')?.value,
            true
          );
        }
      });
      this.subscriptions.add(routeSub);
    } else {
      this.isEditando = false;
      this.clienteId = undefined;
      this.initForm(); // Inicializa form para novo cliente (modal)
      this.form.patchValue({
        ativo: true,
        pais: 'Brasil',
        tipoPessoa: 'Física',
      });
      // Chama setupConditionalDocumentValidation após patchValue para novo cliente (modal)
      this.setupConditionalDocumentValidation(
        this.form.get('tipoPessoa')?.value,
        true
      );
      this.carregarMarcas();
      this.carregarModelos();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.modalFormAparelhoRef?.nativeElement) {
        this.modalAparelhoInstance = new bootstrap.Modal(
          this.modalFormAparelhoRef.nativeElement
        );

        this.modalFormAparelhoRef.nativeElement.addEventListener(
          'show.bs.modal',
          () => {
            this.zone.run(() => {
              this.exibirConteudoModalAparelho = true;
              this.cdr.detectChanges();
            });
          }
        );

        this.modalFormAparelhoRef.nativeElement.addEventListener(
          'hidden.bs.modal',
          () => {
            this.zone.run(() => {
              this.exibirConteudoModalAparelho = false;
              this.editandoAparelhoId = undefined;
              if (this.clienteId) {
                this.carregarAparelhosDoCliente(this.clienteId);
              }
              this.cdr.detectChanges();
            });
          }
        );
      }
    }
  }

  // Adicionar o método setupConditionalDocumentValidation
  private setupConditionalDocumentValidation(
    tipoPessoa: string | null,
    limparCamposCondicionais: boolean
  ): void {
    const cpfControl = this.form.get('cpf');
    const cnpjControl = this.form.get('cnpj');

    if (!cpfControl || !cnpjControl) return;

    if (limparCamposCondicionais) {
      cpfControl.setValue('', { emitEvent: false });
      cnpjControl.setValue('', { emitEvent: false });
    }

    if (tipoPessoa === 'Física') {
      cpfControl.setValidators([ cpfValidator()]);
      cpfControl.enable({ emitEvent: false });
      cnpjControl.setValidators([cnpjValidator()]);
      cnpjControl.disable({ emitEvent: false });
      if (limparCamposCondicionais)
        cnpjControl.setValue('', { emitEvent: false }); // Limpa o campo desabilitado se a flag estiver ativa
    } else if (tipoPessoa === 'Jurídica') {
      cnpjControl.setValidators([ cnpjValidator()]);
      cnpjControl.enable({ emitEvent: false });
      cpfControl.setValidators([cpfValidator()]);
      cpfControl.disable({ emitEvent: false });
      if (limparCamposCondicionais)
        cpfControl.setValue('', { emitEvent: false }); // Limpa o campo desabilitado se a flag estiver ativa
    } else {
      cpfControl.setValidators([cpfValidator()]);
      cpfControl.disable({ emitEvent: false });
      cnpjControl.setValidators([cnpjValidator()]);
      cnpjControl.disable({ emitEvent: false });
      if (limparCamposCondicionais) {
        cpfControl.setValue('', { emitEvent: false });
        cnpjControl.setValue('', { emitEvent: false });
      }
    }
    cpfControl.updateValueAndValidity({ emitEvent: false });
    cnpjControl.updateValueAndValidity({ emitEvent: false });
  }

  fecharModalNovoClienteManual(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoInstance?.hide();
    }
  }

  initForm(cliente?: Cliente): void {
    this.form = this.fb.group({
      // DADOS PESSOAIS
      nomeCompleto: [
        cliente?.nomeCompleto || '',
        [Validators.required, Validators.minLength(3)], // <-- MANTIDO OBRIGATÓRIO
      ],
      apelido: [cliente?.apelido || ''],

      // DOCUMENTAÇÃO
      tipoPessoa: [cliente?.tipoPessoa || 'Física', Validators.required], // <-- MANTIDO OBRIGATÓRIO
      cpf: [cliente?.cpf || '', [cpfValidator()]], // Validador de formato mantido, mas não é mais 'required'
      cnpj: [cliente?.cnpj || '', [cnpjValidator()]], // Validador de formato mantido, mas não é mais 'required'

      // CONTATO
      celular: [cliente?.celular || null],
      email: [cliente?.email || null, [Validators.email]], // Validador de formato de email mantido, mas não é mais 'required'
      telefone: [cliente?.telefone || null],

      // ENDEREÇO
      cep: [cliente?.cep || ''],
      logradouro: [cliente?.logradouro || ''],
      numero: [cliente?.numero || ''],
      complemento: [cliente?.complemento || ''],
      bairro: [cliente?.bairro || ''],
      cidade: [cliente?.cidade || ''],
      uf: [cliente?.uf || ''],
      pais: [cliente?.pais || 'Brasil'],

      // CONFIGURAÇÕES
      ativo: [cliente ? (cliente as any).ativo ?? true : true],
    });

    // O valueChanges é adicionado APÓS o form ser criado.
    // A configuração inicial dos validadores de CPF/CNPJ baseada no valor de 'cliente'
    // (ou default 'Física') será feita após esta função, tipicamente em carregarCliente ou ngOnInit.
    // No entanto, para garantir que a configuração inicial seja feita mesmo se `cliente` for undefined (novo cliente),
    // chamaremos setupConditionalDocumentValidation explicitamente após initForm.
    if (this.subscriptions.closed) {
      // Recria o subscription se necessário (ex: se o componente for reutilizado)
      this.subscriptions = new Subscription();
    }

    this.subscriptions.add(
      this.form.get('tipoPessoa')?.valueChanges.subscribe((tipo) => {
        // Ao mudar o tipo manualmente, limpar os campos.
        this.setupConditionalDocumentValidation(tipo, true);
      })
    );

    // Configuração inicial baseada no valor que `cliente` pode ter fornecido (ou default)
    // O parâmetro 'limparCamposCondicionais' é false aqui para não apagar dados que vieram de 'cliente'
    if (cliente) {
      this.setupConditionalDocumentValidation(cliente.tipoPessoa, false);
    } else {
      this.setupConditionalDocumentValidation(
        this.form.get('tipoPessoa')?.value,
        true
      ); // Para novo cliente, limpar pode ser ok
    }
  }

  // ... (onSubmit precisa ser ajustado para pegar cpf/cnpj corretamente)
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning(
        'Formulário inválido. Verifique os campos destacados.'
      );
      return;
    }

    const clienteDataFromForm = this.form.getRawValue(); // Usar getRawValue para pegar CPF/CNPJ mesmo se desabilitado (embora a lógica os limpe)
    let cpfParaSalvar: string | undefined = undefined;
    let cnpjParaSalvar: string | undefined = undefined;

    const telefoneParaSalvar =
      clienteDataFromForm.telefone &&
      String(clienteDataFromForm.telefone).trim() !== ''
        ? String(clienteDataFromForm.telefone).trim()
        : null;

    if (
      clienteDataFromForm.tipoPessoa === 'Física' &&
      clienteDataFromForm.cpf
    ) {
      cpfParaSalvar = String(clienteDataFromForm.cpf).replace(/\D/g, '');
    } else if (
      clienteDataFromForm.tipoPessoa === 'Jurídica' &&
      clienteDataFromForm.cnpj
    ) {
      cnpjParaSalvar = String(clienteDataFromForm.cnpj).replace(/\D/g, '');
    }
    const formValue = this.form.getRawValue();

    const emailParaEnviar = formValue.email && formValue.email.trim() !== '' ? formValue.email : null;
    const celularParaEnviar = formValue.celular && formValue.celular.trim() !== '' ? formValue.celular : null;
    const telefoneParaEnviar = formValue.telefone && formValue.telefone.trim() !== '' ? formValue.telefone : null;

    if (this.isEditando && this.clienteId) {
      this.isLoading = true;
      const checkAndUpdateSub = this.clienteService
        .obterPorId(this.clienteId)
        .pipe(
          switchMap((clienteAtualDoBanco) => {
            if (!clienteAtualDoBanco) {
              this.toastService.error(
                'Cliente não encontrado no servidor. Pode ter sido excluído.'
              );
              if (!this.isModal) this.router.navigate(['/cliente']);
              return EMPTY;
            }
            const dataModificacaoAtualBanco =
              clienteAtualDoBanco.dataModificacao || null;
            const originalTimestamp = this.dataModificacaoOriginal
              ? new Date(this.dataModificacaoOriginal).getTime()
              : null;
            const atualBancoTimestamp = dataModificacaoAtualBanco
              ? new Date(dataModificacaoAtualBanco).getTime()
              : null;

            if (
              originalTimestamp &&
              atualBancoTimestamp &&
              originalTimestamp !== atualBancoTimestamp
            ) {
              return of({
                error: 'concurrency',
                clienteDoBanco: clienteAtualDoBanco,
              });
            }
            // Se OK, prosseguir com atualização
            const payload: ClienteAtualizacaoPayload = {
              id: this.clienteId!,
              nomeCompleto: clienteDataFromForm.nomeCompleto,
              apelido: clienteDataFromForm.apelido,
              telefone: telefoneParaEnviar, // Obrigatório
              celular: celularParaEnviar,
              email: emailParaEnviar,
              tipoPessoa: clienteDataFromForm.tipoPessoa,
              cpf: cpfParaSalvar,
              cnpj: cnpjParaSalvar,
              pais: clienteDataFromForm.pais,
              uf: clienteDataFromForm.uf,
              cidade: clienteDataFromForm.cidade,
              cep: clienteDataFromForm.cep,
              complemento: clienteDataFromForm.complemento,
              bairro: clienteDataFromForm.bairro,
              logradouro: clienteDataFromForm.logradouro,
              numero: clienteDataFromForm.numero,
              ativo: clienteDataFromForm.ativo,
              dataUltimaModificacao: this.dataModificacaoOriginal, // Envia a data que o form carregou
            };
            return this.clienteService.atualizarCliente(
              this.clienteId!,
              payload
            );
          }),
          tap(() => (this.isLoading = false)),
          catchError((err) => {
            this.isLoading = false;
            if (err.error !== 'concurrency') {
              const errorMsg =
                err.message ||
                (typeof err === 'string'
                  ? err
                  : 'Erro ao verificar/atualizar cliente.');
              this.toastService.error(errorMsg);
              console.error('Erro no pipe de atualização:', err);
            }
            return of(err);
          })
        )
        .subscribe({
          next: (
            response: Cliente | { error: string; clienteDoBanco: Cliente }
          ) => {
            if ((response as { error: string })?.error === 'concurrency') {
              const clienteDoBanco = (
                response as { error: string; clienteDoBanco: Cliente }
              ).clienteDoBanco;
              this.toastService.warning(
                'Este registro foi alterado. Seus dados não foram salvos. O formulário foi atualizado com os dados mais recentes.'
              );
              this.dataModificacaoOriginal = clienteDoBanco.dataModificacao;
              // Repopular o formulário INTEIRO e reconfigurar validações CPF/CNPJ sem limpar
              this.initForm(clienteDoBanco); // Isso chamará setupConditional com limparCampos=false
              if ((clienteDoBanco as any).ativo !== undefined) {
                this.form.patchValue(
                  { ativo: (clienteDoBanco as any).ativo },
                  { emitEvent: false }
                );
              }
              return;
            }

            const clienteAtualizado = response as Cliente;
            if (clienteAtualizado && clienteAtualizado.id) {
              this.toastService.success('Cliente atualizado com sucesso!');
              this.dataModificacaoOriginal = clienteAtualizado.dataModificacao;

              // Guardar o tipoPessoa antes do patchValue
              const tipoPessoaAtual = this.form.get('tipoPessoa')?.value;
              this.form.patchValue(clienteAtualizado, { emitEvent: false }); // Não disparar valueChanges aqui

              // Se o tipoPessoa mudou no backend, o valueChanges não foi acionado.
              // Precisamos garantir que setupConditionalDocumentValidation seja chamado com o novo tipo.
              if (tipoPessoaAtual !== clienteAtualizado.tipoPessoa) {
                this.setupConditionalDocumentValidation(
                  clienteAtualizado.tipoPessoa,
                  false
                ); // Não limpar o CPF/CNPJ que veio do patch
              }
              // Se o tipo não mudou, mas o CPF/CNPJ veio no clienteAtualizado, ele já foi setado pelo patchValue.
              // A lógica de enable/disable e validadores já está correta pelo setup anterior.

              // Re-patch do CPF/CNPJ para garantir, se necessário (após o setup ser chamado se o tipo mudou)
              if (clienteAtualizado.tipoPessoa === 'Física') {
                this.form.get('cpf')?.patchValue(clienteAtualizado.cpf || '', {
                  emitEvent: false,
                });
              } else if (clienteAtualizado.tipoPessoa === 'Jurídica') {
                this.form
                  .get('cnpj')
                  ?.patchValue(clienteAtualizado.cnpj || '', {
                    emitEvent: false,
                  });
              }

              if ((clienteAtualizado as any).ativo !== undefined) {
                this.form.patchValue(
                  { ativo: (clienteAtualizado as any).ativo },
                  { emitEvent: false }
                );
              }

              if (this.isModal) {
                this.clienteSalvo.emit(clienteAtualizado);
              }
            } else if (!(response as { error: string })?.error) {
              console.warn(
                'Resposta inesperada após tentativa de atualização:',
                response
              );
            }
          },
          error: (err) => {
            // Este error é para erros não capturados pelo catchError no pipe ou erros da pré-busca
            this.isLoading = false;
            // Se o erro foi de concorrência e passou pelo catchError, pode já ter sido logado.
            // Esta é uma segunda barreira.
            if (err.error !== 'concurrency') {
              const errorMsg =
                err.message ||
                (typeof err === 'string'
                  ? err
                  : 'Erro geral ao atualizar cliente.');
              this.toastService.error(errorMsg);
              console.error('Erro final na subscrição de atualização:', err);
            }
          },
        });
      this.subscriptions.add(checkAndUpdateSub);
    } else {
      // MODO CRIAÇÃO (NOVO CLIENTE)
      this.isLoading = true; // Ativa o spinner para a operação de criação
      const payload: ClienteCriacaoPayload = {
        
        
        nomeCompleto: clienteDataFromForm.nomeCompleto,
        apelido: clienteDataFromForm.apelido,
        telefone: telefoneParaSalvar !== null && telefoneParaSalvar.trim() !== '' ? telefoneParaSalvar : null,
        celular: clienteDataFromForm.celular !== null && clienteDataFromForm.celular.trim() !== '' ?  clienteDataFromForm.celular : null,
        email: clienteDataFromForm.email !== null && clienteDataFromForm.email.trim() !== '' ? clienteDataFromForm.email : null,
        tipoPessoa: clienteDataFromForm.tipoPessoa,
        cpf: cpfParaSalvar,
        cnpj: cnpjParaSalvar,
        pais: clienteDataFromForm.pais,
        uf: clienteDataFromForm.uf,
        cidade: clienteDataFromForm.cidade,
        cep: clienteDataFromForm.cep,
        complemento: clienteDataFromForm.complemento,
        bairro: clienteDataFromForm.bairro,
        logradouro: clienteDataFromForm.logradouro,
        numero: clienteDataFromForm.numero,
        ativo: clienteDataFromForm.ativo,
      };

      console.log(payload);

      const addSub = this.clienteService.criarCliente(payload).subscribe({
        next: (clienteCriado) => {
          this.isLoading = false;
          this.toastService.success('Cliente salvo com sucesso!');
          if (this.isModal) {
            this.clienteId = clienteCriado.id;
            this.isEditando = true;
            this.dataModificacaoOriginal = clienteCriado.dataModificacao; // Guarda a data do recém-criado
            this.form.patchValue(clienteCriado);
            if ((clienteCriado as any).ativo !== undefined) {
              this.form.patchValue({ ativo: (clienteCriado as any).ativo });
            } else {
              this.form.patchValue({ ativo: true });
            }
            this.carregarAparelhosDoCliente(this.clienteId!);
            if (!this.carregouMarcas) this.carregarMarcas();
            if (!this.carregouModelos) this.carregarModelos();
            this.clienteSalvo.emit(clienteCriado);
          } else {
            this.router.navigate(['/cliente']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          const errorMsg =
            error.message ||
            (typeof error === 'string' ? error : 'Erro ao criar cliente.');
          this.toastService.error(errorMsg);
          console.error('Erro ao criar cliente:', error);
        },
      });
      this.subscriptions.add(addSub);
    }
  }

  onCancelar(): void {
    if (this.isModal) {
      this.clienteSalvo.emit(undefined);
    } else {
      this.router.navigate(['/cliente']);
    }
  }

  abrirModalNovoAparelhoParaCliente(): void {
    if (!this.clienteId) {
      this.toastService.warning(
        'É necessário salvar o cliente antes de adicionar um aparelho.'
      ); // Usando ToastService
      return;
    }
    this.editandoAparelhoId = undefined;
    this.exibirConteudoModalAparelho = true;
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.modalAparelhoInstance?.show(), 0);
    }
  }

  editarAparelhoViaModal(aparelhoId: number): void {
    if (!this.clienteId) return;
    this.editandoAparelhoId = aparelhoId;
    this.exibirConteudoModalAparelho = true;
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.modalAparelhoInstance?.show(), 0);
    }
  }

  handleAparelhoSalvoOuCancelado(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoInstance?.hide();
      if (this.clienteId) {
        this.carregarAparelhosDoCliente(this.clienteId);
      }
    }
  }

  carregarCliente(id: number): void {
    this.isLoading = true;
    const clienteSub = this.clienteService.obterPorId(id).subscribe({
      next: (cliente) => {
        if (cliente) {
          this.dataModificacaoOriginal = cliente.dataModificacao;
          this.initForm(cliente); // Popula o formulário e configura os validadores CPF/CNPJ sem limpar
          // A chamada a setupConditionalDocumentValidation dentro do initForm já cuida disso com limparCampos=false

          // Garante que o estado ativo seja corretamente aplicado
          if ((cliente as any).ativo !== undefined) {
            this.form.patchValue(
              { ativo: (cliente as any).ativo },
              { emitEvent: false }
            );
          }
        } else {
          this.toastService.error('Cliente não encontrado.');
          if (!this.isModal) this.router.navigate(['/cliente']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.error('Erro ao carregar cliente.');
        console.error(error);
        this.isLoading = false;
        if (!this.isModal) this.router.navigate(['/cliente']);
      },
    });
    this.subscriptions.add(clienteSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoInstance?.dispose();
    }
  }

  onExcluir(): void {
    if (this.clienteId) {
      const checkAparelhosSub = this.aparelhoService
        .buscarPorCliente(this.clienteId)
        .subscribe(
          (aparelhosDoCliente) => {
            if (aparelhosDoCliente && aparelhosDoCliente.length > 0) {
              this.toastService.warning(
                `Este cliente possui ${aparelhosDoCliente.length} aparelho(s) cadastrado(s). Exclua os aparelhos primeiro.` // Usando ToastService
              );
              return;
            }

            // Usando ConfirmationService
            const config: ConfirmationConfig = {
              title: 'Confirmar Exclusão',
              message: `Tem certeza que deseja excluir o cliente? Esta ação não pode ser desfeita.`,
              acceptButtonText: 'Sim, Excluir',
              acceptButtonClass: 'btn-danger',
              cancelButtonText: 'Não, Manter',
            };

            const confirmSub = this.confirmationService
              .confirm(config)
              .subscribe((confirmed) => {
                if (confirmed) {
                  this.isLoading = true;
                  const deleteSub = this.clienteService
                    .remover(this.clienteId!)
                    .subscribe({
                      next: () => {
                        this.toastService.success(
                          'Cliente excluído com sucesso!'
                        ); // Usando ToastService
                        this.isLoading = false;
                        if (this.isModal) {
                          this.clienteSalvo.emit(undefined);
                        } else {
                          this.router.navigate(['/cliente']);
                        }
                      },
                      error: (error) => {
                        this.isLoading = false;
                        const errorMsg =
                          error.message ||
                          (typeof error === 'string'
                            ? error
                            : 'Erro ao excluir cliente.');
                        this.toastService.error(errorMsg); // Usando ToastService
                        console.error('Erro ao excluir cliente:', error);
                      },
                    });
                  this.subscriptions.add(deleteSub);
                }
              });
            this.subscriptions.add(confirmSub);
          },
          (error) => {
            this.toastService.error('Erro ao verificar aparelhos do cliente.'); // Usando ToastService
            console.error(
              'Erro ao buscar aparelhos antes de excluir cliente:',
              error
            );
          }
        );
      this.subscriptions.add(checkAparelhosSub);
    }
  }

  onCepBlur() {
    const cep = this.form.value.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      this.limparCamposEndereco();
      return;
    }

    this.loadingCep = true;
    this.cepError = '';

    const cepSub = this.http
      .get<any>(`https://viacep.com.br/ws/${cep}/json/`)
      .subscribe({
        next: (data) => {
          if (data.erro) {
            this.cepError = 'CEP não encontrado.';
            this.limparCamposEndereco(cep);
          } else {
            this.form.patchValue({
              cidade: data.localidade || '',
              logradouro: data.logradouro || '',
              bairro: data.bairro || '',
              uf: data.uf || '',
              pais: 'Brasil',
              complemento: data.complemento || '',
            });
          }
          this.loadingCep = false;
        },
        error: (err) => {
          console.error('Erro ao consultar CEP:', err);
          this.cepError = 'Erro ao consultar CEP.';
          this.limparCamposEndereco(cep);
          this.loadingCep = false;
        },
      });
    this.subscriptions.add(cepSub);
  }

  private limparCamposEndereco(cepMantido?: string): void {
    this.form.patchValue({
      cidade: '',
      logradouro: '',
      bairro: '',
      uf: '',
      pais: 'Brasil',
      complemento: '',
      cep: cepMantido || '',
    });
  }

  // O método showToast local foi REMOVIDO.
  // Certifique-se de que seu app.component.html (ou similar)
  // está configurado para renderizar os toasts do ToastService.

  carregarMarcas(): void {
    this.isLoading = true;
    const marcaSub = this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.marcas = data;
        this.carregouMarcas = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.toastService.error('Erro ao carregar marcas.'); // Usando ToastService
        this.carregouMarcas = true;
        this.verificarCarregamento();
      },
    });
    this.subscriptions.add(marcaSub);
  }

  carregarModelos(): void {
    const modeloSub = this.modeloService.obterTodos().subscribe({
      next: (data: Modelo[]) => {
        this.modelos = data;
        this.carregouModelos = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar modelos', err);
        this.toastService.error('Erro ao carregar modelos.'); // Usando ToastService
        this.carregouModelos = true;
        this.verificarCarregamento();
      },
    });
    this.subscriptions.add(modeloSub);
  }

  carregarAparelhosDoCliente(clienteId: number): void {
    if (!clienteId) return;
    const aparelhoSub = this.aparelhoService
      .buscarPorCliente(clienteId)
      .subscribe({
        next: (aparelhos) => {
          this.aparelhos = aparelhos;
          console.log(aparelhos);
        },
        error: (err) => {
          console.error('Erro ao carregar aparelhos do cliente:', err);
          this.toastService.error('Erro ao carregar aparelhos do cliente'); // Usando ToastService
        },
      });
    this.subscriptions.add(aparelhoSub);
  }

  private verificarCarregamento(): void {
    if (this.carregouMarcas && this.carregouModelos) {
      if (
        !this.isEditando ||
        (this.isEditando && this.form.value.nomeCompleto)
      ) {
        this.isLoading = false;
      }
    }
  }

  getNomeMarca(idMarca: number): string {
    const marca = this.marcas.find((m) => m.id == idMarca);
    return marca ? marca.nome : 'Desconhecida';
  }

  getNomeModelo(idModelo: number): string {
    const modelo = this.modelos.find((m) => m.id == idModelo);
    return modelo ? modelo.nome : 'Desconhecido';
  }

  excluirAparelho(id: number): void {
    if (this.clienteId) {
      const config: ConfirmationConfig = {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o aparelho? Esta ação não pode ser desfeita.`,
        acceptButtonText: 'Sim, Excluir',
        acceptButtonClass: 'btn-danger',
        cancelButtonText: 'Não, Manter',
      };
      const confirmSub = this.confirmationService
        .confirm(config)
        .subscribe((confirmed) => {
          if (confirmed) {
            this.isLoading = true;
            const excluirSub = this.aparelhoService.excluir(id).subscribe(
              () => {
                this.carregarAparelhosDoCliente(this.clienteId!);
                this.toastService.success('Aparelho excluído com sucesso!'); // Usando ToastService
                this.isLoading = false;
              },
              (error) => {
                this.toastService.error('Erro ao excluir aparelho!'); // Usando ToastService
                console.error('Erro ao excluir aparelho:', error);
                this.isLoading = false;
              }
            );
            this.subscriptions.add(excluirSub);
          }
        });
      this.subscriptions.add(confirmSub);
    }
  }

  // Adicionar dentro da classe FormClienteComponent (form-cliente.component.ts)

  public isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return control
      ? control.invalid && (control.dirty || control.touched)
      : false;
  }

  // Opcional, mas útil para acessar erros específicos de forma mais limpa no template
  public getControlErrors(controlName: string): any {
    const control = this.form.get(controlName);
    return control ? control.errors : null;
  }

  // Para o título dinâmico do card, similar ao {{ isEditMode ? ... }} do exemplo
  get cardTitle(): string {
    return this.isEditando ? 'Editar Cliente' : 'Cadastrar Novo Cliente';
  }

  // Para o texto dinâmico do botão salvar
  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Cliente' : 'Salvar Cliente';
  }

  editarAparelho(id: number): void {
    if (!this.isModal) {
      this.router.navigate([
        '/aparelho/form',
        id,
        { clienteId: this.clienteId },
      ]);
    } else {
      if (!this.clienteId) {
        this.toastService.error(
          'ID do cliente não encontrado para editar aparelho.'
        ); // Usando ToastService
        return;
      }
      this.editarAparelhoViaModal(id);
    }
  }
}
