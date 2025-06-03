import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';
import { AparelhoService } from '../../../../services/aparelho.service';
import { ClienteService } from '../../../../services/cliente.service';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Aparelho } from '../../../../Models/aparelho.model';

declare const bootstrap: any;

@Component({
  selector: 'app-form-aparelho',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './form-aparelho.component.html',
  styleUrls: ['./form-aparelho.component.css']
})
export class FormAparelhoComponent implements OnInit {
  @Input() clienteId?: number;
  @Input() modoEmbedded = false;
  @Input() aparelhoIdParaEditar?: number; // Para edição via OS
  @Output() salvar = new EventEmitter<Aparelho | undefined>(); // Emite o aparelho salvo
  @Output() cancelar = new EventEmitter<void>();

  formAparelho: FormGroup;
  isEditando = false;
  clientes: any[] = [];
  marcas: any[] = [];
  modelos: any[] = [];
  modelosFiltrados: any[] = [];
  aparelhoIdEditando?: number;

  constructor(
    private fb: FormBuilder,
    private aparelhoService: AparelhoService,
    private clienteService: ClienteService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formAparelho = this.fb.group({
      id_cliente: [null, Validators.required],
      id_marca: [null, Validators.required],
      id_modelo: [null, Validators.required],
      imei_1: [''],
      imei_2: [''],
      cor: [''],
      observacoes: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();

    if (this.clienteId) {
      this.formAparelho.patchValue({ id_cliente: this.clienteId });
      if (this.modoEmbedded) { // modoEmbedded geralmente significa que o cliente não deve ser alterado
          this.formAparelho.get('id_cliente')?.disable();
      }
    }

    if (!this.modoEmbedded) {
      this.route.paramMap.subscribe((params: { get: (arg0: string) => any; }) => {
        const id = params.get('id');
        if (id) {
          this.isEditando = true;
          this.aparelhoIdEditando = +id;
          this.carregarAparelho(this.aparelhoIdEditando);
        }
      });
    }

    if (this.aparelhoIdParaEditar) {
      this.isEditando = true;
      this.carregarAparelho(this.aparelhoIdParaEditar);
    } else if (!this.modoEmbedded) { // Lógica de rota para página completa
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        const routeClienteId = params.get('clienteId'); // Se vier da rota
        if (id) {
          this.isEditando = true;
          this.aparelhoIdParaEditar = +id;
          this.carregarAparelho(this.aparelhoIdParaEditar);
        }
        if(routeClienteId && !this.clienteId) { // Prioriza @Input clienteId se ambos presentes
            this.clienteId = +routeClienteId;
            this.formAparelho.patchValue({ id_cliente: this.clienteId });
        }
      });
    }
  }

  carregarDadosIniciais(): void {
    // this.clienteService.getClientes().subscribe(clientes => {
    //   this.clientes = clientes;
    // });

    this.marcaService.getMarcas().subscribe(marcas => {
      this.marcas = marcas;
    });

    this.modeloService.getModelos().subscribe(modelos => {
      this.modelos = modelos;
    });
  }

  onMarcaChange(): void {
    const marcaId = this.formAparelho.get('id_marca')?.value;
    if (marcaId) {
      this.modelosFiltrados = this.modelos.filter(m => m.id_marca === marcaId);
      this.formAparelho.get('id_modelo')?.reset();
    } else {
      this.modelosFiltrados = [];
    }
  }

  carregarAparelho(id: number): void {
    this.aparelhoService.buscarPorId(id).subscribe(aparelho => {
      if (aparelho) {
        // Primeiro filtra os modelos da marca selecionada
        this.modelosFiltrados = this.modelos.filter(m => m.id_marca === aparelho.id_marca);

        // Depois seta os valores do formulário
        this.formAparelho.patchValue({
          id_cliente: aparelho.id_cliente,
          id_marca: aparelho.id_marca,
          id_modelo: aparelho.id_modelo,
          imei_1: aparelho.imei_1,
          imei_2: aparelho.imei_2,
          cor: aparelho.cor,
          observacoes: aparelho.observacoes
        });
      }
    });
  }

   onSubmit(): void {
    if (this.formAparelho.invalid) {
      this.formAparelho.markAllAsTouched();
      this.showToast('Formulário de aparelho inválido.');
      return;
    }
    const aparelhoData = this.formAparelho.getRawValue();
    // Garante que id_cliente esteja no payload se veio do @Input
    if (this.clienteId && !aparelhoData.id_cliente) {
        aparelhoData.id_cliente = this.clienteId;
    }
    if (this.isEditando && this.aparelhoIdParaEditar) {
      this.aparelhoService.atualizar(this.aparelhoIdParaEditar, aparelhoData).subscribe({
        next: (aparelhoAtualizado) => this.onSucesso('Aparelho atualizado!', aparelhoAtualizado),
        error: (err) => this.onErro('Erro ao atualizar aparelho.', err)
      });
    } else {
      const { id, ...aparelhoParaCriar } = aparelhoData; // Remove ID para criação
      this.aparelhoService.criar(aparelhoParaCriar as Aparelho).subscribe({
        next: (aparelhoCriado) => this.onSucesso('Aparelho cadastrado!', aparelhoCriado),
        error: (err) => this.onErro('Erro ao cadastrar aparelho.', err)
      });
    }
  }

  onSucesso(mensagem: string, aparelho?: Aparelho): void {
    this.showToast(mensagem);
    this.salvar.emit(aparelho); // Emite o aparelho para o componente pai (FormOrdemServico ou FormCliente)
  }





  onErro(mensagem: string, erro: any): void {
    console.error(mensagem, erro);
    alert(mensagem);
  }

onCancelar(): void {
  if (this.modoEmbedded) {
    this.cancelar.emit();
  } else if (this.formAparelho.value.id_cliente) {
    this.router.navigate(['/cliente/form', this.formAparelho.value.id_cliente]);
  } else {
    this.router.navigate(['/aparelho']);
  }
}


  onExcluir(): void {
    if (confirm('Deseja realmente excluir este aparelho?') && this.aparelhoIdEditando) {
      this.aparelhoService.excluir(this.aparelhoIdEditando).subscribe({
        next: () => this.onSucesso('Aparelho excluído com sucesso!'),
        error: (err) => this.onErro('Erro ao excluir aparelho', err)
      });
    }
  }

  showToast(message: string) {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
