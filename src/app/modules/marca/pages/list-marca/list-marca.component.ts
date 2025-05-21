// src/app/components/pages/marca/list-marca/list-marca.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MarcaService } from '../../../../services/marca.service';
import { Marca } from '../../../../Models/marca.model';

declare const bootstrap: any;

@Component({
    selector: 'app-list-marca',
    imports: [NgIf, NgFor, RouterModule, CommonModule],
    templateUrl: './list-marca.component.html',
    styleUrl: './list-marca.component.css'
})
export class ListMarcaComponent implements OnInit {
  marcas: Marca[] = [];
  carregando = true;
  @ViewChild('toast') toastElement!: ElementRef;

  constructor(private marcaService: MarcaService, private router: Router) {}

  ngOnInit(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.marcas = data;
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.carregando = false;
      }
    });
  }

  carregarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.marcas = data;
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.carregando = false;
      }
    });
  }

  novoMarca(): void {
    this.router.navigate(['/marca/form']);
  }

  editarMarca(id: number): void {
    this.router.navigate(['/marca/form', id]);
  }

  excluir(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta marca?')) {
      this.marcaService.excluir(id).subscribe(() => {
        this.exibirToast();
      });
    }
  }

  exibirToast(): void {
    const toast = new bootstrap.Toast(this.toastElement.nativeElement);
    toast.show();
  }

}
