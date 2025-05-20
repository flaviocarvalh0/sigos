import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { EmpresaService } from '../../../../services/empresa.service';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { Empresa } from '../../../../Models/empresa.model';


@Component({
  selector: 'app-form-empresa',
  standalone: true,
  templateUrl: './form-empresa.component.html',
  imports: [ReactiveFormsModule, HttpClientModule, NgIf, CommonModule, FormsModule],
  styleUrls: ['./form-empresa.component.css']
})
export class FormEmpresaComponent implements OnInit {

  form: FormGroup;
  isEditando = false;
  empresaId?: number;
  loadingCep = false;
  cepError = '';

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      razao_social: ['', [Validators.required, Validators.minLength(3)]],
      nome_empresa: [''],
      cnpj: [''], 
      cep: [''],
      cidade: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      uf: [''],
      pais: [''],
      telefone: [''],
      email: ['', [Validators.required, Validators.email]],
      ativo: [true]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.empresaId = idParam ? Number(idParam) : undefined;

    if (this.empresaId) {
      this.isEditando = true;
      this.carregarEmpresa(this.empresaId);
    }
  }

  carregarEmpresa(id: number): void {
    this.empresaService.getEmpresaById(id).subscribe({
      next: (empresa) => {
        if (empresa) {
          this.form.patchValue(empresa);
        } else {
          console.error('Empresa não encontrada');
          this.router.navigate(['/empresa']);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar empresa:', err);
      }
    });
  }

  onCepBlur(): void {
    const cep = this.form.get('cep')?.value;
    if (cep && cep.length === 8) { // formato 00000-000
      this.loadingCep = true;
      this.cepError = '';
      this.http.get<any>(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`).subscribe({
        next: (data) => {
          if (data.erro) {
            this.cepError = 'CEP não encontrado.';
          } else {
            this.form.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf,
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

    const empresa: Empresa = this.form.value;

    if (this.isEditando && this.empresaId) {
      this.empresaService.updateEmpresa(this.empresaId, empresa).subscribe({
        next: () => this.router.navigate(['/empresa']),
        error: (err) => console.error('Erro ao atualizar empresa:', err)
      });
    } else {
      this.empresaService.addEmpresa(empresa).subscribe({
        next: () => {
          this.form.reset({ ativo: true });
          this.router.navigate(['/empresa']);
        },
        error: (err) => console.error('Erro ao salvar empresa:', err)
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/empresa']);
  }

  onExcluir(): void {
    if (this.empresaId && confirm('Confirma exclusão da empresa?')) {
      this.empresaService.deleteEmpresa(this.empresaId).subscribe({
        next: () => this.router.navigate(['/empresa']),
        error: (err) => console.error('Erro ao excluir empresa:', err)
      });
    }
  }

}
