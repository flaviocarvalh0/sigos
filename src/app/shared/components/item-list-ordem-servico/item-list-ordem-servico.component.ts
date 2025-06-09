import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-item-list-ordem-servico',
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './item-list-ordem-servico.component.html',
  styleUrl: './item-list-ordem-servico.component.css',
})
export class ItemListOrdemServicoComponent {
  @Input() titulo: string = '';
  @Input() itensDisponiveis: any[] = [];
  @Input() itensAdicionados: any[] = [];

  @Input() novoItem: any;
  @Input() campos: {
  label: string;
  propriedade: string;
  tipo: 'input' | 'number' | 'select' | 'moeda';
  formato?: 'moeda'; // NOVO: para definir como exibir na tabela
  bindLabel?: string;
  bindValue?: string;
  placeholder?: string;
  readonly?: boolean;
  largura?: string;
  options?: any[];
}[] = [];

  @Input() descricaoItem: (item: any) => string = () => '';
  @Output() salvar = new EventEmitter<void>();
  @Output() remover = new EventEmitter<number>();
  @Output() atualizarCampo = new EventEmitter<{ campo: string; valor: any }>();
}
