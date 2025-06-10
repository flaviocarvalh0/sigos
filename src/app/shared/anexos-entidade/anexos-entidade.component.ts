// src/app/shared/components/anexos-entidade/anexos-entidade.component.ts

import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- 1. IMPORTAR FormsModule
import { AnexoService } from '../../services/ordem-servico/os-anexo.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { Anexo, AnexoCriacaoPayload, AnexoAtualizacaoPayload, AnexoEdicaoSimplesPayload } from '../../Models/ordem-servico/os-anexos.model';
import { take } from 'rxjs';

declare const bootstrap: any;

@Component({
  selector: 'app-anexos-entidade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ], // <-- 1. ADICIONAR FormsModule AQUI
  templateUrl: './anexos-entidade.component.html',
  styleUrls: ['./anexos-entidade.component.css']
})
export class AnexosEntidadeComponent implements OnInit, AfterViewInit {
  @Input() entidadeTipo!: string;
  @Input() entidadeId!: number;

  @ViewChild('modalEditarAnexoRef') modalEditarAnexoRef!: ElementRef;
  private modalEditarInstance: any;
  anexoParaEditar: Anexo | null = null;
  formEdicao!: FormGroup;

  anexos: Anexo[] = [];
  isLoading = false;
  arquivoSelecionado: File | null = null;
  isUploading = false;

  constructor(
    private anexoService: AnexoService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
     private cdr: ChangeDetectorRef
  ) {

    this.formEdicao = new FormGroup({
      titulo: new FormControl(''),
      legenda: new FormControl(''),
      observacoes: new FormControl('')
    });
  }

  ngOnInit(): void {
    if (this.entidadeId && this.entidadeTipo) {
      this.carregarAnexos();
      console.log('1' + this.anexoParaEditar);
      console.log('1' + this.entidadeTipo);
      console.log('1' + this.entidadeId);
    }
  }

  ngAfterViewInit(): void {
    if (this.modalEditarAnexoRef?.nativeElement) {
      this.modalEditarInstance = new bootstrap.Modal(this.modalEditarAnexoRef.nativeElement);
    }
  }

  carregarAnexos(): void {
    this.isLoading = true;
    this.anexoService.obterAnexosPorEntidade(this.entidadeTipo, this.entidadeId).subscribe({
      next: (data) => {
        this.anexos = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Erro ao carregar anexos.');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.arquivoSelecionado = input.files[0];
    } else {
      this.arquivoSelecionado = null;
    }
  }

  fazerUpload(): void {
    if (!this.arquivoSelecionado) {
      this.toastService.warning('Selecione um arquivo primeiro.');
      return;
    }
    if (!this.entidadeId) {
       this.toastService.error('ID da entidade não fornecido.');
       return;
    }

    this.isUploading = true;
    const leitor = new FileReader();
    leitor.readAsDataURL(this.arquivoSelecionado);

    leitor.onload = () => {
      const base64String = (leitor.result as string).split(',')[1];
      const payload: AnexoCriacaoPayload = {
        entidadeTipo: this.entidadeTipo,
        entidadeId: this.entidadeId,
        nomeArquivo: this.arquivoSelecionado!.name,
        tipoArquivo: this.arquivoSelecionado!.type,
        arquivoStream: base64String,
        titulo: this.arquivoSelecionado!.name // Define um título padrão
      };

      console.log('Enviando este payload para a API:', payload);

      this.anexoService.criarAnexo(payload).subscribe({
        next: () => {
          this.toastService.success('Anexo enviado com sucesso!');
          this.arquivoSelecionado = null;
          this.isUploading = false;
          (document.getElementById('anexo-file-input') as HTMLInputElement).value = ''; // Limpa o input
          this.carregarAnexos();
        },
        error: (err) => {
          this.toastService.error('Falha ao enviar anexo.');
          console.error(err);
          this.isUploading = false;
        }
      });
    };

    leitor.onerror = (error) => {
      this.toastService.error('Erro ao ler o arquivo.');
      console.error(error);
      this.isUploading = false;
    };
  }

  baixarAnexo(anexo: Anexo): void {
    this.toastService.info('Iniciando download...');
    this.anexoService.downloadAnexo(anexo.id, anexo.tipoArquivo).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = anexo.nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      },
      error: (err) => {
        this.toastService.error('Erro ao baixar o anexo.');
        console.error(err);
      }
    });
  }

  removerAnexo(anexo: Anexo): void {
    this.confirmationService.confirm({
      title: 'Confirmar Remoção',
      message: `Tem certeza que deseja remover o anexo "${anexo.titulo || anexo.nomeArquivo}"?`
    })
    .pipe(take(1))
    .subscribe(confirmed => {
      if (confirmed) {
        this.anexoService.removerAnexo(anexo.id).subscribe({
          next: () => {
            this.toastService.success('Anexo removido com sucesso.');
            this.anexos = this.anexos.filter(a => a.id !== anexo.id);
          },
          error: (err) => {
            this.toastService.error('Erro ao remover o anexo.');
            console.error(err);
          }
        });
      }
    });
  }
// ...

 abrirModalEdicao(anexo: Anexo): void {
    this.anexoParaEditar = anexo; // Ainda guardamos o anexo original para ter o ID e outras props

    // PREENCHE O FORMULÁRIO REATIVO com os dados do anexo
    this.formEdicao.patchValue({
      titulo: anexo.titulo,
      legenda: anexo.legenda,
      observacoes: anexo.observacoes
    });

    if (this.modalEditarInstance) {
      this.modalEditarInstance.show();
    }
  }

// ...

 salvarAlteracoesAnexo(): void {
    if (!this.anexoParaEditar) return;

    this.isUploading = true;

    const formValues = this.formEdicao.value;

    // O payload agora usa a nova interface AnexoEdicaoSimplesPayload
    const payload: AnexoEdicaoSimplesPayload = {
      id: this.anexoParaEditar.id,
      titulo: formValues.titulo,
      legenda: formValues.legenda,
      observacoes: formValues.observacoes,
      dataUltimaModificacao: this.anexoParaEditar.dataModificacao!
    };

    // Chama o novo método do serviço que usa PATCH
    this.anexoService.atualizarDadosSimplesAnexo(payload).subscribe({
      next: () => {
        this.toastService.success('Anexo atualizado com sucesso!');
        this.isUploading = false;
        this.modalEditarInstance.hide();
        this.carregarAnexos();
      },
      error: (err) => {
        this.toastService.error('Falha ao atualizar o anexo.');
        console.error(err);
        this.isUploading = false;
      }
    });
  }

  formatarData(data: Date | string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data));
  }

  
}
