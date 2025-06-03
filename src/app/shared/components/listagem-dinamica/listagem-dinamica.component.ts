// listagem-dinamica.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-listagem-dinamica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listagem-dinamica.component.html',
  styleUrls: ['./listagem-dinamica.component.css'],
})
export class ListagemDinamicaComponent {
  @Input() titulo = 'Lista';
  @Input() dados: any[] = [];
  @Input() colunas: {
    campo: string;
    titulo: string;
    ordenavel?: boolean;
    filtro?: boolean;
  }[] = [];
  @Input() carregando = false;
  @Input() campoId = 'id';
  @Input() campoNome = 'nome';

  @Output() criarNovo = new EventEmitter<void>();
  @Output() editar = new EventEmitter<number>();
  @Output() excluir = new EventEmitter<number>();

  filtros: { [key: string]: string } = {};
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  buscarAtivado = false;

  campoFiltroSelecionado: string = '';
  valorFiltro: string = '';

  colunaSelecionada = '';

  get placeholderFiltro(): string {
    const col = this.colunas.find((c) => c.campo === this.colunaSelecionada);
    return col ? `Digite ${col.titulo.toLowerCase()}...` : 'Digite o valor...';
  }

  get nomeCampoSelecionado(): string {
    const col = this.colunas.find((c) => c.campo === this.colunaSelecionada);
    return col ? col.titulo : '';
  }

  aplicarFiltro(): void {
    if (this.colunaSelecionada) {
      this.filtros[this.colunaSelecionada] = this.valorFiltro;
    }
  }

  get dadosFiltrados(): any[] {
    let filtrado = this.dados.filter((item) => {
      return Object.entries(this.filtros).every(([campo, valor]) => {
        if (!valor) return true;
        return item[campo]
          ?.toString()
          .toLowerCase()
          .includes(valor.toLowerCase());
      });
    });

    if (this.sortColumn) {
      filtrado = filtrado.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];
        return this.sortDirection === 'asc'
          ? valA > valB
            ? 1
            : -1
          : valA < valB
          ? 1
          : -1;
      });
    }
    return filtrado;
  }

  onSort(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  limparFiltros(): void {
    this.colunaSelecionada = '';
    this.valorFiltro = '';
    for (const campo of Object.keys(this.filtros)) {
      this.filtros[campo] = '';
    }
  }

  aplicarBusca(): void {
    this.limparFiltros(); // limpa todos os outros
    if (this.campoFiltroSelecionado && this.valorFiltro) {
      this.filtros[this.campoFiltroSelecionado] = this.valorFiltro;
    }
  }

  get colunasFiltraveis() {
    return this.colunas.filter((c) => c.filtro);
  }

  onEditar(id: number): void {
    this.editar.emit(id);
  }

  onExcluir(id: number): void {
    this.excluir.emit(id);
  }

  onCriar(): void {
    this.criarNovo.emit();
  }

  inicializarFiltros(): void {
    for (const col of this.colunas) {
      if (col.filtro) {
        this.filtros[col.campo] = '';
      }
    }
  }

  ngOnInit(): void {
    this.inicializarFiltros();
  }
}
