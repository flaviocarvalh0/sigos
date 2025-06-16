import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule, KeyValue } from '@angular/common';
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
  opcoes?: { id: any; nome: string }[];
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
  abas: SecaoFormularioConfig[];
}

@Component({
  selector: 'app-formulario-dinamico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, CurrencyMaskModule],
  templateUrl: './formulario-dinamico.component.html',
  styleUrls: ['./formulario-dinamico.component.css'],
})
export class FormularioDinamicoComponent implements OnInit, OnChanges {
  @Input() config!: FormularioDinamicoConfig;
  @Input() form!: FormGroup;  // Agora o formulário vem de fora
  @Input() data: any = {};

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.inicializarFormulario();
    }
  }

  inicializarFormulario(): void {
    if (!this.form) {
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
  }

  isInvalidControl(nome: string): boolean {
    const control = this.form.get(nome);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getControlErrors(nome: string): any {
    return this.form.get(nome)?.errors;
  }

  compareKeyValue(a: KeyValue<string, any>, b: KeyValue<string, any>): number {
    return 0;
  }
}
