import { NgSelectModule } from '@ng-select/ng-select';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-ordem-servico',
  templateUrl: './form-ordem-servico.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
})
export class FormOrdemServicoComponent implements OnInit {
  form!: FormGroup;

  // Mock de dados dos selects (substitua com service real)
  marcas = [
    { id: 1, nome: 'Apple' },
    { id: 2, nome: 'Samsung' },
  ];
  clientes = [
    { id: 1, nome: 'João' },
    { id: 2, nome: 'Maria' },
  ];
  aparelhos = [
    { id: 1, descricao: 'iPhone X' },
    { id: 2, descricao: 'Galaxy S21' },
  ];
  empresas = [{ id: 1, nome: 'Assistência 1' }];
  servicos = [
    { id: 1, descricao: 'Troca de Tela' },
    { id: 2, descricao: 'Troca de Bateria' },
  ];
  pecas = [
    { id: 1, descricao: 'Tela iPhone X' },
    { id: 2, descricao: 'Bateria Samsung' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo: [''],
      status: ['pendente', Validators.required],
      id_empresa: [null, Validators.required],
      id_cliente: [null, Validators.required],
      id_aparelho: [null, Validators.required],
      data_criacao: [null, Validators.required],
      data_retirada: [null],
      relato_cliente: [''],
      relato_tecnico: [''],
      observacoes: [''],
      valor_total: [0, [Validators.required, Validators.min(0)]],
      data_execucao: [null],
      data_conclusao: [null],
      servicos: this.fb.array([]),
      pecas: this.fb.array([]),
      anexos: this.fb.array([]),
    });
  }

  // SERVIÇOS
  get servicosFormArray(): FormArray {
    return this.form.get('servicos') as FormArray;
  }

  addServico(): void {
    this.servicosFormArray.push(
      this.fb.group({
        id_servico: [null, Validators.required],
        valor: [0, Validators.required],
        observacao: [''],
      })
    );
  }

  removeServico(index: number): void {
    this.servicosFormArray.removeAt(index);
  }

  // PEÇAS
  get pecasFormArray(): FormArray {
    return this.form.get('pecas') as FormArray;
  }

  addPeca(): void {
    this.pecasFormArray.push(
      this.fb.group({
        id_peca: [null, Validators.required],
        quantidade: [1, Validators.required],
        valor_unitario: [0, Validators.required],
      })
    );
  }

  removePeca(index: number): void {
    this.pecasFormArray.removeAt(index);
  }

  // ANEXOS
  get anexosFormArray(): FormArray {
    return this.form.get('anexos') as FormArray;
  }

  addAnexo(): void {
    this.anexosFormArray.push(
      this.fb.group({
        nome_arquivo: [''],
        arquivo: [null],
      })
    );
  }

  removeAnexo(index: number): void {
    this.anexosFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Formulário enviado:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
