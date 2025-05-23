import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup , Validators } from '@angular/forms';
import { ReactiveFormsModule} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { Marca } from '../../../../Models/marca.model';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

declare const bootstrap: any;

@Component({
    selector: 'app-form-modelo',
    templateUrl: './form-modelo.component.html',
    styleUrls: ['./form-modelo.component.css'],
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
})
export class FormModeloComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEditando = false;
  form: FormGroup;
  marcas: Marca[] = [];
  modeloId: number | null = null;

  constructor(
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      id_marca: [null as number | null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarMarcas();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modeloId = +id;
        this.carregarModelo(this.modeloId);
        this.isEditando = true;
      }
    });
  }

  carregarMarcas(): void {
    this.marcaService.getMarcas().subscribe(marcas => {
      this.marcas = marcas;
    });
  }

  carregarModelo(id: number): void {
    this.modeloService.getModeloById(id).subscribe(modelo => {
      if (modelo) {
        this.form.patchValue({
          nome: modelo.nome,
          id_marca: modelo.id_marca
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      const modeloData = {
        ...formData,
        id_marca: Number(formData.id_marca) // Conversão explícita
      };

      if (this.isEditando && this.modeloId) {
        this.modeloService.atualizar(this.modeloId, modeloData).subscribe({
          next: () => {
            this.showToast('Modelo atualizado com sucesso!');
            this.router.navigate(['/modelo']);
          },
          error: (err) => {
            console.error('Erro ao atualizar modelo:', err);
            this.showToast('Erro ao atualizar modelo');
          }
        });
      } else {
        this.modeloService.criar(modeloData).subscribe({
          next: () => {
            this.showToast('Modelo criado com sucesso!');
            this.router.navigate(['/modelo']);
          },
          error: (err) => {
            console.error('Erro ao criar modelo:', err);
            this.showToast('Erro ao criar modelo');
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancelar(): void {
    this.router.navigate(['/modelo']);
  }

  onExcluir(): void {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      if (this.modeloId) {
        this.modeloService.excluir(this.modeloId).subscribe({
          next: () => {
            this.showToast('Modelo excluído com sucesso!');
            this.router.navigate(['/modelo']);
          },
          error: (err) => {
            console.error('Erro ao excluir modelo:', err);
            this.showToast('Erro ao excluir modelo');
          }
        });
      }
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
