import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AparelhoService } from '../../../../services/aparelho.service';
import { Cliente } from '../../../../Models/cliente.model';
import { Aparelho } from '../../../../Models/aparelho.model';
import { ClienteService } from '../../../../services/cliente.service';
import { Marca } from '../../../../Models/marca.model';
import { Modelo } from '../../../../Models/modelo.model';


declare const bootstrap: any;

@Component({
  selector: 'app-form-aparelho',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, CommonModule],
  templateUrl: './form-aparelho.component.html',
  styleUrl: './form-aparelho.component.css'
})
export class FormAparelhoComponent implements OnInit {
  formAparelho!: FormGroup;
  isEditando = false;
  clientes: Cliente[] = [];
  marcas: Marca[] = [];
  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];

  clienteId: number = 0;
  aparelhoIdEditando?: number;

  constructor(
    private fb: FormBuilder,
    private aparelhoService: AparelhoService,
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {

    this.clienteService.getClientes().subscribe(clientes => {
      this.clientes = clientes;
    });

    this.formAparelho = this.fb.group({
      id_cliente: ['', Validators.required],
      id_marca: ['', Validators.required],
      id_modelo: ['', Validators.required],
      imei_1: [''],
      imei_2: [''],
      cor: [''],
      observacoes: ['']
    });


    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditando = true;
        this.aparelhoIdEditando = +id;
        this.carregarAparelho(this.aparelhoIdEditando);
      }
    });
  }

  carregarAparelho(id: number) {
    this.aparelhoService.buscarPorId(id).subscribe(aparelho => {
      if (aparelho) {
        this.formAparelho.patchValue(aparelho);
        this.onMarcaChange();
      }
    });
  }

  onMarcaChange() {
    const marcaId = this.formAparelho.get('id_marca')?.value;
    this.modelosFiltrados = this.modelos.filter(m => m.id_marca == marcaId);
    this.formAparelho.get('id_modelo')?.setValue('');
  }

  onSubmit() {
    if (this.formAparelho.invalid) {
      this.formAparelho.markAllAsTouched();
      return;
    }

    const aparelho: Aparelho = this.formAparelho.value;

    if (this.isEditando && this.aparelhoIdEditando) {
      this.aparelhoService.atualizar(this.aparelhoIdEditando, aparelho).subscribe(() => {
        this.showToast('Aparelho atualizado com sucesso!');
        this.router.navigate(['/aparelho']);
      });
    } else {
      this.aparelhoService.criar(aparelho).subscribe(() => {
        this.showToast('Aparelho cadastrado com sucesso!');
        this.router.navigate(['/aparelho']);
      });
    }
  }

  onCancelar() {
    this.formAparelho.reset();
    this.router.navigate(['/aparelho']);
  }

  onExcluir() {
    if (this.isEditando && this.aparelhoIdEditando && confirm('Deseja excluir este aparelho?')) {
      this.aparelhoService.excluir(this.aparelhoIdEditando).subscribe(() => {
        this.showToast('Aparelho excluído com sucesso!');
        this.router.navigate(['/aparelho']);
      }, error => {
        this.showToast('Erro ao excluir aparelho.');
        console.error(error);
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
