import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { Router, RouterModule } from '@angular/router';
import { Modelo } from '../../../../Models/modelo.model';
import { Marca } from '../../../../Models/marca.model';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-list-modelo',
    templateUrl: './list-modelo.component.html',
    styleUrl: './list-modelo.component.css',
    imports: [RouterModule, CommonModule],
    standalone: true,
})
export class ListModeloComponent implements OnInit {
  @ViewChild('toast') toastElement!: ElementRef;
  modelos: Modelo[] = [];
  marcas: Marca[] = [];
  carregando = true;

  constructor(
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregando = true;
    this.modeloService.getModelos().subscribe({
      next: (data) => {
        this.modelos = data;
        this.verificarFimCarregamento();
      },
      error: () => this.verificarFimCarregamento(),
    });

    this.marcaService.getMarcas().subscribe({
      next: (data) => {
        this.marcas = data;
        this.verificarFimCarregamento();
      },
      error: () => this.verificarFimCarregamento(),
    });
  }

  pendentes = 2;
  verificarFimCarregamento() {
    this.pendentes--;
    if (this.pendentes === 0) {
      this.carregando = false;
    }
  }

  getNomeMarca(idMarca: number): string {
    const marca = this.marcas.find((m) => m.id === idMarca);
    return marca ? marca.nome : 'Desconhecida';
  }

  editarModelo(id: number) {
    this.router.navigate(['/modelo/form', id]);
  }

  novoModelo() {
    this.router.navigate(['/modelo/form']);
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      this.modeloService.excluir(id).subscribe(() => {
        this.modelos = this.modelos.filter((m) => m.id !== id);
      });
    }
  }
}
