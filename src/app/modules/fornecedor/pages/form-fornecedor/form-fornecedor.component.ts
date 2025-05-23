import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-form-fornecedor',
    templateUrl: './form-fornecedor.component.html',
    standalone: true,
    styleUrls: ['./form-fornecedor.component.css'],
    imports: [
    CommonModule,
    ReactiveFormsModule
  ],
})
export class FormFornecedorComponent implements OnInit {

  form: FormGroup;
  isEditando = false;
  fornecedorId?: number;
  loadingCep = false;
  cepError = '';
  private fb = inject(FormBuilder);
  constructor(
    private fornecedorService: FornecedorService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cep: [''],
      cidade: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      uf: [''],
      pais: [''],
      telefone: [''],
      celular: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      ativo: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.fornecedorId = idParam ? Number(idParam) : undefined;

    if (this.fornecedorId) {
      this.isEditando = true;
      this.carregarFornecedor(this.fornecedorId);
    }
  }

  carregarFornecedor(id: number): void {
    this.fornecedorService.getById(id).subscribe({
      next: (fornecedor) => {
        if (fornecedor) {
          this.form.patchValue(fornecedor);
        } else {
          console.error('Fornecedor não encontrado');
          this.router.navigate(['/fornecedor']);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar fornecedor:', err);
      }
    });
  }

  onCepBlur(): void {
    const cep = this.form.get('cep')?.value;
    if (cep && cep.replace('-', '').length === 8) {
      this.loadingCep = true;
      this.cepError = '';
      this.http.get<any>(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`).subscribe({
        next: (data) => {
          if (data.erro) {
            this.cepError = 'CEP não encontrado.';
          } else {
            this.form.patchValue({
              logradouro: data.logradouro || '',
              bairro: data.bairro || '',
              cidade: data.localidade || '',
              numero: this.form.get('numero')?.value || '',
              complemento: this.form.get('complemento')?.value || '',
              uf: data.uf || '',
              pais: 'Brasil'
            });
          }
          this.loadingCep = false;
        },
        error: () => {
          this.cepError = 'Erro ao buscar o CEP.';
          this.loadingCep = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fornecedor = this.form.value;

    if (this.isEditando && this.fornecedorId) {
      this.fornecedorService.atualizar(this.fornecedorId, fornecedor).subscribe({
        next: () => this.router.navigate(['/fornecedor']),
        error: (err) => console.error('Erro ao atualizar fornecedor:', err)
      });
    } else {
      this.fornecedorService.adicionar(fornecedor).subscribe({
        next: () => {
          this.form.reset({ ativo: true });
          this.router.navigate(['/fornecedor']);
        },
        error: (err) => console.error('Erro ao salvar fornecedor:', err)
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/fornecedor']);
  }

  onExcluir(): void {
    if (this.fornecedorId && confirm('Confirma exclusão do fornecedor?')) {
      this.fornecedorService.deletar(this.fornecedorId).subscribe({
        next: () => this.router.navigate(['/fornecedor']),
        error: (err) => console.error('Erro ao excluir fornecedor:', err)
      });
    }
  }
}
