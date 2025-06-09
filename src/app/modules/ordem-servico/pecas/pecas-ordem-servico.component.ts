import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnInit,
  Output,
} from '@angular/core';
import { OrdemServicoPecaService } from '../../../services/ordem-servico/ordem-servico-peca.service';
import { ToastService } from '../../../services/toast.service';
import {
  OrdemServicoPeca,
  OrdemServicoPecaCriacaoPayload,
} from '../../../Models/ordem-servico/ordem-servico-peca.model';
import { CommonModule } from '@angular/common';
import { FormsModule, NgSelectOption } from '@angular/forms';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { RespostaApi } from '../../../Models/reposta-api.model';
import { OrdemServicoServiceResponse } from '../../../Models/ordem-servico/ordem-servico-service-response';

@Component({
  selector: 'app-pecas-ordem-servico',
  templateUrl: './pecas-ordem-servico.component.html',
  styleUrls: ['./pecas-ordem-servico.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
})
export class PecasOrdemServicoComponent implements OnInit {
  @Input() ordemServicoId!: number;
  @Input() ordemServico!: OrdemServico;
  @Input() pecasDisponiveis: any[] = [];
  @Output() osAtualizada = new EventEmitter<OrdemServico>();

  novaPeca: OrdemServicoPecaCriacaoPayload = this.criarNovaPeca();
  pecasAdicionadas: OrdemServicoPeca[] = [];

  constructor(
    private pecaService: OrdemServicoPecaService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarPecas();
  }

  criarNovaPeca(): OrdemServicoPecaCriacaoPayload {
    return {
      idOrdemServico: this.ordemServicoId,
      idPeca: null!,
      quantidade: 1,
      valorUnitario: 0,
      valorMaoObra: 0,
      valorTotal: 0,
      observacao: '',
    };
  }

  salvarPeca(): void {
  if (!this.novaPeca.idPeca || this.novaPeca.quantidade <= 0) {
    this.toast.warning('Preencha todos os campos obrigatórios.');
    return;
  }

  this.novaPeca.valorTotal = this.novaPeca.quantidade * this.novaPeca.valorUnitario;
  this.novaPeca.idOrdemServico = this.ordemServicoId;
  this.pecaService.criarPeca(this.ordemServicoId, this.novaPeca).subscribe({
    next: (resposta: OrdemServicoServiceResponse) => {
      this.toast.success('Peça adicionada.');
      this.ordemServico = resposta.ordemServicoAtualizada; // <- IMPORTANTE
      this.osAtualizada.emit(resposta.ordemServicoAtualizada);
      this.novaPeca = this.criarNovaPeca();
      this.carregarPecas();
    },
    error: (err) => this.toast.error(err.message),
  });
}


  removerPeca(id: number): void {
    this.pecaService.removerPeca(this.ordemServicoId, id).subscribe({
      next: (resposta: OrdemServicoServiceResponse) => {
        this.toast.success('Peça removida.');
        this.osAtualizada.emit(resposta.ordemServicoAtualizada);
        this.carregarPecas();
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  carregarPecas(): void {
    this.pecaService.obterPorOrdemServico(this.ordemServicoId).subscribe({
      next: (res) => (this.pecasAdicionadas = res.dados || []),
      error: (err) => this.toast.error(err.message),
    });
  }

  calcularTotal(): number {
    return this.pecasAdicionadas.reduce(
      (acc, p) => acc + (p.valorTotal || 0),
      0
    );
  }

  getDescricaoPeca(p: OrdemServicoPeca): string {
    return (
      p.nomePeca ||
      this.pecasDisponiveis.find((pd) => pd.id === p.idPeca)?.descricao ||
      'Desconhecida'
    );
  }

  aoSelecionarPeca(): void {
    const pecaSelecionada = this.pecasDisponiveis.find(
      (p) => p.id === this.novaPeca.idPeca
    );
    console.log(pecaSelecionada);
    if (pecaSelecionada) {
      this.novaPeca.valorUnitario = pecaSelecionada.precoVenda || 0;
      this.novaPeca.valorTotal =
        this.novaPeca.quantidade * this.novaPeca.valorUnitario;
    }
  }
}
