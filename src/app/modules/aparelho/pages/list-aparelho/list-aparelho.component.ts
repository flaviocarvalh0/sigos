import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Aparelho } from '../../../../Models/aparelho.model';
import { AparelhoService } from '../../../../services/aparelho.service';
import { ClienteService } from '../../../../services/cliente.service';

import { Cliente } from '../../../../Models/cliente.model';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';

declare const bootstrap: any;

@Component({
    selector: 'app-list-aparelho',
    imports: [NgFor, NgIf, RouterModule],
    standalone: true,
    templateUrl: './list-aparelho.component.html',
    styleUrl: './list-aparelho.component.css'
})
export class ListAparelhoComponent implements OnInit {
  aparelhos: Aparelho[] = [];
  clientes: Cliente[] = [];
  marcas: { id: number; nome: string }[] = [];
  modelos: { id: number; nome: string }[] = [];

  carregando = true;

  @ViewChild('toast') toastElement!: ElementRef;

  private carregouClientes = false;
  private carregouAparelhos = false;
  private carregouMarcas = false;
  private carregouModelos = false;

  constructor(
    private aparelhoService: AparelhoService,
    private clienteService: ClienteService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregando = true;
    this.carregarClientes();
    this.carregarAparelhos();
    this.carregarMarcas();
    this.carregarModelos();
  }

  carregarAparelhos(): void {
    this.aparelhoService.listar().subscribe({
      next: data => {
        this.aparelhos = data;
        this.carregouAparelhos = true;
        this.verificarCarregamento();
      },
      error: err => {
        console.error('Erro ao carregar aparelhos', err);
        this.carregouAparelhos = true; // Para não travar a aplicação
        this.verificarCarregamento();
      }
    });
  }

  carregarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: data => {
        this.clientes = data;
        this.carregouClientes = true;
        this.verificarCarregamento();
      },
      error: err => {
        console.error('Erro ao carregar clientes', err);
        this.carregouClientes = true;
        this.verificarCarregamento();
      }
    });
  }

  carregarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: { id: number; nome: string; }[]) => {
        this.marcas = data;
        this.carregouMarcas = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.carregouMarcas = true;
        this.verificarCarregamento();
      }
    });
  }

  carregarModelos(): void {
    this.modeloService.getModelos().subscribe({
      next: (data: { id: number; nome: string; }[]) => {
        this.modelos = data;
        this.carregouModelos = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar modelos', err);
        this.carregouModelos = true;
        this.verificarCarregamento();
      }
    });
  }

  private verificarCarregamento(): void {
    if (
      this.carregouAparelhos &&
      this.carregouClientes &&
      this.carregouMarcas &&
      this.carregouModelos
    ) {
      this.carregando = false;
    }
  }

  getNomeMarca(idMarca: number): string {
    const marca = this.marcas.find(m => m.id === idMarca);
    return marca ? marca.nome : 'Desconhecida';
  }

  getNomeModelo(idModelo: number): string {
    const modelo = this.modelos.find(m => m.id === idModelo);
    return modelo ? modelo.nome : 'Desconhecido';
  }

  getNomeCliente(idCliente: number): string {
    const cliente = this.clientes.find(c => c.id === idCliente);
    return cliente ? cliente.nome_completo : 'Desconhecido';
  }

  editarParalho(id: number) {
    this.router.navigate(['/aparelho/form', id]);
  }

  novoAparelho() {
    this.router.navigate(['/aparelho/form']);
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este aparelho?')) {
      this.aparelhoService.excluir(id).subscribe(() => {
        this.carregarAparelhos();
        this.exibirToast();
      });
    }
  }

  exibirToast() {
    const toast = new bootstrap.Toast(this.toastElement.nativeElement);
    toast.show();
  }
}
