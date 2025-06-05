// form-dinamico.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule, KeyValue } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CurrencyMaskModule } from 'ng2-currency-mask';

export interface CampoFormularioConfig {
  nome: string;
  tipo: 'texto' | 'inteiro' | 'email' | 'senha' | 'data' | 'checkbox' | 'select' | 'textarea' | 'booleano' | 'moeda';
  rotulo: string;
  placeholder?: string;
  obrigatorio?: boolean;
  col?: string;
  mask?: string;
  opcoes?: { id: any, nome: string;  }[];
  mensagensErro?: { [key: string]: string };
}

interface SecaoFormularioConfig {
  titulo?: string;
  campos: CampoFormularioConfig[];
}

export interface FormularioDinamicoConfig {
  titulo: string;
  iconeTitulo?: string;
  classeTituloCard?: string;
  botoes?: {
    salvarTexto?: string;
    cancelarTexto?: string;
    excluirTexto?: string;
    cancelar?: boolean;
    excluir?: boolean;
  };
  abas: SecaoFormularioConfig[];
}

@Component({
  selector: 'app-form-dinamico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgSelectModule, CurrencyMaskModule],
  templateUrl: './formulario-dinamico.component.html',
  styleUrls: ['./formulario-dinamico.component.css'],
})
export class FormularioDinamicoComponent implements OnInit, OnChanges {
  @Input() config!: FormularioDinamicoConfig;
  @Input() isEditando = false;
  @Input() isLoading = false;
  @Input() data: any = {};

  @Output() salvar = new EventEmitter<any>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() excluir = new EventEmitter<void>();

  fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({});

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    const grupo: { [chave: string]: FormControl } = {};

    this.config.abas.forEach(secao => {
      secao.campos.forEach(campo => {
        const validadores = [];
        if (campo.obrigatorio) validadores.push(Validators.required);
        grupo[campo.nome] = new FormControl(this.data[campo.nome] || '', validadores);
      });
    });

    this.form = this.fb.group(grupo);
  }
compareKeyValue(a: KeyValue<string, any>, b: KeyValue<string, any>): number {
  return 0;
}
ngOnChanges(changes: SimpleChanges): void {
  if (changes['data'] && !changes['data'].firstChange) {
    this.inicializarFormulario(); // Recria o form com os novos valores
  }
}


  isInvalidControl(nome: string): boolean {
    const control = this.form.get(nome);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getControlErrors(nome: string): any {
    return this.form.get(nome)?.errors;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.salvar.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onExcluir(): void {
    this.excluir.emit();
  }
}
