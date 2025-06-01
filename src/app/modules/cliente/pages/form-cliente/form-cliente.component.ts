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
} from '@angular/core'; // Adicionado OnDestroy
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms'; // FormsModule e NgModel não são necessários com ReactiveForms
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ClienteService } from '../../../../services/cliente.service';
import { Cliente } from '../../../../Models/cliente.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Adicionado RouterModule se houver routerLink no template
import { CommonModule, isPlatformBrowser } from '@angular/common'; // NgIf vem do CommonModule
import { FormAparelhoComponent } from '../../../aparelho/pages/form-aparelho/form-aparelho.component';
import { AparelhoService } from '../../../../services/aparelho.service';
import { Aparelho } from '../../../../Models/aparelho.model';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { Marca } from '../../../../Models/marca.model';
import { Modelo } from '../../../../Models/modelo.model';
import { Subscription } from 'rxjs'; // Adicionado Subscription
import { emit } from 'process';

declare const bootstrap: any;
// Declarado para usar o Bootstrap Toast
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
  @Output() clienteSalvo = new EventEmitter<Cliente | undefined>(); // Pode emitir undefined ao cancelar

  private fb = inject(FormBuilder); // fb já estava no seu código original
  isEditando = false; // Renomeado de isEditMode para consistência com seu código
  clienteId: number | undefined; // Mantido do seu código original
  // editingClienteId: number | null = null; // Redundante se clienteId for usado para o mesmo propósito
  form!: FormGroup;
  isLoading = false; // Adicionado para feedback de carregamento
  loadingCep = false;
  cepError = '';
  aparelhoService: AparelhoService = inject(AparelhoService); // Já estava no seu código
  aparelhos: Aparelho[] = [];
  marcas: Marca[] = []; // Tipado corretamente
  modelos: Modelo[] = []; // Tipado corretamente
  private carregouMarcas = false;
  private carregouModelos = false;
  // private carregando = false; // Substituído por isLoading global

  abaSelecionada = 'dados'; // Inicializa com dados, pode ser 'aparelhos'
  @ViewChild('modalFormAparelhoRef') modalFormAparelhoRef!: ElementRef;
  private modalAparelhoInstance: any; // Ou bootstrap.Modal
  exibirConteudoModalAparelho = false;
  editandoAparelhoId: number | undefined = undefined;

  private subscriptions = new Subscription(); // Para gerenciar subscriptions

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private http: HttpClient, // Para ViaCEP
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private router: Router,
    private marcaService: MarcaService,
    private modeloService: ModeloService
  ) {
    // A inicialização do form foi movida para initForm() para consistência
  }

  // Seu ngOnInit atual
  ngOnInit(): void {
    this.initForm(); // Inicializa o formulário (potencialmente vazio)
    if (!this.isModal) {
      const routeSub = this.route.paramMap.subscribe((params) => {
        const idParam = params.get('id');
        if (idParam) {
          // Modo edição via rota
          this.clienteId = +idParam;
          this.isEditando = true;
          this.carregarCliente(this.clienteId); // Chama initForm(cliente) aqui dentro
          this.carregarAparelhosDoCliente(this.clienteId);
          this.carregarMarcas();
          this.carregarModelos();
        } else {
          // Modo criação via rota
          this.isEditando = false;
          this.form.patchValue({ ativo: true }); // Aplica default ao form já inicializado (vazio)
        }
      });
      this.subscriptions.add(routeSub);
    } else {
      // Modo modal (assume-se sempre para NOVO cliente inicialmente)
      this.isEditando = false;
      this.clienteId = undefined;
      // this.initForm(); // Já chamado no início do ngOnInit. Se chamar de novo, reseta.
      this.form.patchValue({ ativo: true }); // Aplica default ao form já inicializado (vazio)
      this.carregarMarcas(); // Pode carregar para o form de aparelho
      this.carregarModelos();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.modalFormAparelhoRef?.nativeElement) {
        this.modalAparelhoInstance = new bootstrap.Modal(this.modalFormAparelhoRef.nativeElement);

        this.modalFormAparelhoRef.nativeElement.addEventListener('show.bs.modal', () => {
          this.zone.run(() => { // <<-- Executar dentro da Zona Angular
            this.exibirConteudoModalAparelho = true;
            this.cdr.detectChanges();
          });
        });

        this.modalFormAparelhoRef.nativeElement.addEventListener('hidden.bs.modal', () => {
          this.zone.run(() => {
            this.exibirConteudoModalAparelho = false;
            this.editandoAparelhoId = undefined;
            if (this.clienteId) {
              this.carregarAparelhosDoCliente(this.clienteId);
            }
            this.cdr.detectChanges();
          });
        });
      }
    }
  }

   fecharModalNovoClienteManual(): void { // Se o btn-close do modal não estiver funcionando via data-bs-dismiss
        if (isPlatformBrowser(this.platformId)) {
            this.modalAparelhoInstance?.hide();
        }
    }

  initForm(cliente?: Cliente): void {
    // Método para (re)inicializar o formulário
    this.form = this.fb.group({
      // Usando os campos do seu FormGroup original
      nome_completo: [
        cliente?.nome_completo || '',
        [Validators.required, Validators.minLength(3)],
      ],
      apelido: [cliente?.apelido || ''],
      cep: [cliente?.cep || ''],
      cidade: [cliente?.cidade || ''],
      logradouro: [cliente?.logradouro || ''],
      numero: [cliente?.numero || ''],
      complemento: [cliente?.complemento || ''],
      bairro: [cliente?.bairro || ''],
      uf: [cliente?.uf || ''],
      pais: [cliente?.pais || 'Brasil'], // Default 'Brasil'
      telefone_principal: [cliente?.telefone || ''], // Renomeado de 'telefone'
      celular: [cliente?.celular || '', Validators.required],
      email: [cliente?.email || '', [Validators.required, Validators.email]],
      tipo_de_pessoa: [cliente?.tipo_de_pessoa || 'F'], // Default 'F' (Física)
      ativo: [cliente ? cliente.ativo : true],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Formulário inválido. Verifique os campos.', 'error');
      return;
    }
    this.isLoading = true;
    const clienteData = this.form.getRawValue() as Cliente;

    if (this.isEditando && this.clienteId) {
      const updateSub = this.clienteService
        .updateCliente(this.clienteId, clienteData)
        .subscribe({});
      this.subscriptions.add(updateSub);
    } else {
      const { id, ...clienteParaCriar } = clienteData;
      const addSub = this.clienteService
        .addCliente(clienteParaCriar as Cliente)
        .subscribe({
          next: (clienteCriado) => {
          console.log('[FormCliente onSubmit] Cliente Criado Recebido:', JSON.stringify(clienteCriado)); // LOG 1
          this.showToast('Cliente salvo com sucesso!');
          this.isLoading = false;
          if (this.isModal) {
            this.clienteId = clienteCriado.id;
            this.isEditando = true;
            console.log('[FormCliente onSubmit] Antes do patchValue. Form value:', JSON.stringify(this.form.value)); // LOG 2
            this.form.patchValue(clienteCriado);
            console.log('[FormCliente onSubmit] DEPOIS do patchValue. Form value:', JSON.stringify(this.form.value)); // LOG 3


              this.carregarAparelhosDoCliente(this.clienteId!);
              this.clienteSalvo.emit(clienteCriado);
              if (!this.carregouMarcas) this.carregarMarcas();
              if (!this.carregouModelos) this.carregarModelos();
            } else {
              this.clienteId = clienteCriado.id;
              this.isEditando = true;
              this.form.patchValue(clienteCriado);
              this.form.patchValue({});

              this.carregarAparelhosDoCliente(this.clienteId!);
              if (!this.carregouMarcas) this.carregarMarcas();
              if (!this.carregouModelos) this.carregarModelos();
            }
          },
          error: (error) => {
            /* ... */
          },
        });
      this.subscriptions.add(addSub);
    }
  }

  onCancelar(): void {
    // Este é o Cancelar do formulário de Cliente
    if (this.isModal) {
      // Se o usuário clica em "Cancelar" no form de cliente DENTRO DO MODAL DA OS,
      // emitimos undefined para que o FormOrdemServicoComponent feche o modal do cliente.
      this.clienteSalvo.emit(undefined);
    } else {
      this.router.navigate(['/cliente']);
    }
  }

  // --- Lógica para Modal de Aparelho DENTRO do Modal de Cliente ---
  abrirModalNovoAparelhoParaCliente(): void {
    if (!this.clienteId) {
      this.showToast(
        'É necessário salvar o cliente antes de adicionar um aparelho.',
        'warning'
      );
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
    const clienteSub = this.clienteService.getClienteById(id).subscribe(
      (cliente) => {
        if (cliente) {
          this.initForm(cliente); // Popula o formulário
        } else {
          this.showToast('Cliente não encontrado.', 'error');
          if (!this.isModal) this.router.navigate(['/cliente']);
        }
        this.isLoading = false;
      },
      (error) => {
        this.showToast('Erro ao carregar cliente.', 'error');
        console.error(error);
        this.isLoading = false;
        if (!this.isModal) this.router.navigate(['/cliente']);
      }
    );
    this.subscriptions.add(clienteSub);
  }

  // ... (ngOnDestroy deve também limpar this.modalAparelhoInstance?.dispose();)
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoInstance?.dispose();
    }
  }

  // AJUSTADO onExcluir no FormClienteComponent
  onExcluir(): void {
    if (this.clienteId) {
      // 1. Verificar se o cliente tem aparelhos
      this.aparelhoService.buscarPorCliente(this.clienteId).subscribe(
        (aparelhosDoCliente) => {
          if (aparelhosDoCliente && aparelhosDoCliente.length > 0) {
            this.showToast(
              `Este cliente possui ${aparelhosDoCliente.length} aparelho(s) cadastrado(s). Exclua os aparelhos primeiro.`,
              'warning'
            );
            return;
          }

          // 2. Se não tem aparelhos, prosseguir com a confirmação e exclusão
          if (
            confirm(
              'Tem certeza que deseja excluir este cliente? Este cliente não possui aparelhos vinculados.'
            )
          ) {
            this.isLoading = true;
            const deleteSub = this.clienteService
              .deleteCliente(this.clienteId!)
              .subscribe({
                next: () => {
                  this.showToast('Cliente excluído com sucesso!');
                  this.isLoading = false;
                  if (this.isModal) {
                    // Se o cliente foi excluído de dentro do modal da OS,
                    // emitir undefined para fechar o modal da OS e talvez atualizar a lista de clientes lá.
                    this.clienteSalvo.emit(undefined);
                  } else {
                    this.router.navigate(['/cliente']);
                  }
                },
                error: (error) => {
                  this.showToast('Erro ao excluir cliente.', 'error');
                  console.error(error);
                  this.isLoading = false;
                },
              });
            this.subscriptions.add(deleteSub);
          }
        },
        (error) => {
          this.showToast('Erro ao verificar aparelhos do cliente.', 'error');
          console.error(
            'Erro ao buscar aparelhos antes de excluir cliente:',
            error
          );
        }
      );
    }
  }

  // onCepBlur e showToast permanecem como no seu código original

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
            this.limparCamposEndereco(cep); // Mantém o CEP digitado
          } else {
            this.form.patchValue({
              cidade: data.localidade || '',
              logradouro: data.logradouro || '',
              bairro: data.bairro || '',
              uf: data.uf || '',
              pais: 'Brasil', // ViaCEP é para o Brasil
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
      cep: cepMantido || '', // Mantém o CEP se fornecido, senão limpa
    });
  }

 showToast(message: string, alertType: 'success' | 'error' | 'warning' = 'success') {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.run(() => { // <<-- Envolver com NgZone.run()
        const toastEl = document.getElementById('liveToast');
        if (toastEl) {
          const toastBody = toastEl.querySelector('.toast-body');
          if (toastBody) {
            toastBody.textContent = message;
          }
          toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white', 'text-dark');
          if (alertType === 'success') toastEl.classList.add('bg-success', 'text-white');
          else if (alertType === 'error') toastEl.classList.add('bg-danger', 'text-white');
          else if (alertType === 'warning') toastEl.classList.add('bg-warning', 'text-dark');

          const toast = new bootstrap.Toast(toastEl);
          toast.show();
        } else {
          console.warn('Elemento Toast #liveToast não encontrado no DOM.');
        }
      });
    } else {
      console.log(`[SSR Toast Log] (${alertType}): ${message}`);
    }
  }


  // Seus métodos de carregamento de marcas, modelos, aparelhos, getNomeMarca, getNomeModelo, excluir, editarAparelho
  // podem ser mantidos como estão, pois são relevantes quando o FormClienteComponent é usado como uma página completa.
  // No contexto do modal de criação de cliente para a OS, eles não serão diretamente utilizados.
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
        this.carregouMarcas = true;
        this.verificarCarregamento();
      },
    });
    this.subscriptions.add(marcaSub);
  }

  carregarModelos(): void {
    const modeloSub = this.modeloService.getModelos().subscribe({
      next: (data: Modelo[]) => {
        this.modelos = data;
        this.carregouModelos = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar modelos', err);
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
        },
        error: (err) => {
          console.error('Erro ao carregar aparelhos do cliente:', err);
          this.showToast('Erro ao carregar aparelhos do cliente', 'error');
        },
      });
    this.subscriptions.add(aparelhoSub);
  }

  private verificarCarregamento(): void {
    if (this.carregouMarcas && this.carregouModelos) {
      this.isLoading = false; // Desativa o loading geral do componente
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
    // Renomeado para evitar conflito
    if (
      this.clienteId &&
      confirm('Tem certeza que deseja excluir este aparelho?')
    ) {
      const excluirSub = this.aparelhoService.excluir(id).subscribe(
        () => {
          this.carregarAparelhosDoCliente(this.clienteId!);
          this.showToast('Aparelho excluído com sucesso!');
        },
        (error) => {
          this.showToast('Erro ao excluir aparelho!', 'error');
        }
      );
      this.subscriptions.add(excluirSub);
    }
  }

  editarAparelho(id: number): void {
    // Renomeado para evitar conflito
    // Quando em modo modal, a edição de aparelho não deve navegar para fora da OS.
    // Se precisar editar aparelho DENTRO do modal de cliente, seria uma lógica mais complexa (outro modal?)
    // Por agora, este botão de editar aparelho pode ser desabilitado ou ocultado no modo modal
    // ou abrir o form de aparelho em um SEGUNDO modal (não recomendado para UX simples).
    if (!this.isModal) {
      this.router.navigate([
        '/aparelho/form',
        id,
        { clienteId: this.clienteId },
      ]);
    } else {
      this.showToast(
        'Edição de aparelho não disponível no modo modal rápido.',
        'warning'
      );
      // Ou abrir FormAparelhoComponent em outro modal aqui.
      // Para simplificar, não vamos implementar edição de aparelho dentro do modal de cliente da OS.
    }
  }
}
