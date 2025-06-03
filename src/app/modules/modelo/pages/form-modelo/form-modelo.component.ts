import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
 selector: 'app-form-modelo',
  templateUrl: './form-modelo.component.html',
  styleUrls: ['./form-modelo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ReactiveFormsModule]
})
export class FormModeloComponent implements OnInit {
  formModelo!: FormGroup;
  isEditando = false;
  isLoading = false;
  cardTitle = 'Cadastrar Modelo';
  saveButtonText = 'Salvar';
  idModelo?: number;
  marcas: { id: number, nome: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.idModelo = Number(this.route.snapshot.paramMap.get('id'));
    this.inicializarFormulario();
    this.carregarMarcas();

    if (this.idModelo) {
      this.isEditando = true;
      this.cardTitle = 'Editar Modelo';
      this.saveButtonText = 'Atualizar';
      this.carregarModelo(this.idModelo);
    }
  }

  inicializarFormulario(): void {
    this.formModelo = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      idMarca: [null, Validators.required],
      dataUltimaModificacao: [null]
    });
  }

  carregarMarcas(): void {
    this.marcaService.obterParaSelecao().subscribe({
      next: (marcas) => this.marcas = marcas.map(m => ({ id: m.id, nome: m.descricao })),
      error: err => this.toastService.error(err.message || 'Erro ao carregar marcas.')
    });
  }

  carregarModelo(id: number): void {
    this.isLoading = true;
    this.modeloService.obterPorId(id).subscribe({
      next: modelo => {
        if (!modelo) return;
        this.formModelo.patchValue({
          nome: modelo.nome,
          idMarca: modelo.idMarca,
          dataUltimaModificacao: modelo.dataModificacao
        });
        this.isLoading = false;
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao carregar modelo.');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.formModelo.invalid) {
      this.formModelo.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    const payload = this.formModelo.value;

    if (this.isEditando && this.idModelo) {
      payload.id = this.idModelo;
      this.modeloService.atualizar(this.idModelo, payload).subscribe({
        next: () => {
          this.toastService.success('Modelo atualizado com sucesso!');
          this.router.navigate(['/modelo']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao atualizar modelo.');
          this.isLoading = false;
        }
      });
    } else {
      this.modeloService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Modelo criado com sucesso!');
          this.router.navigate(['/modelo']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao criar modelo.');
          this.isLoading = false;
        }
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/modelo']);
  }

  onExcluir(): void {
    if (!this.idModelo) return;

    this.isLoading = true;
    this.modeloService.remover(this.idModelo).subscribe({
      next: () => {
        this.toastService.success('Modelo excluído com sucesso!');
        this.router.navigate(['/modelo']);
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao excluir modelo.');
        this.isLoading = false;
      }
    });
  }

  isInvalidControl(controlName: string): boolean {
    const control = this.formModelo.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getControlErrors(controlName: string): any {
    return this.formModelo.get(controlName)?.errors;
  }

  get f() {
    return this.formModelo.controls;
  }
}
