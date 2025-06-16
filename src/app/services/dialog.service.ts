import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Type,
  createComponent
} from '@angular/core';
import { ModalHostComponent } from '../shared/components/modal-host/modal-host.component';

@Injectable({ providedIn: 'root' })
export class ModalService {
  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

  open<T extends object>(component: Type<T>, inputs?: Partial<T>): Promise<any> {
    return new Promise(resolve => {
      // 1. Cria um elemento de host no body
      const hostElement = document.createElement('div');
      document.body.appendChild(hostElement);

      // 2. Cria o componente ModalHost
      const hostCptRef = createComponent(ModalHostComponent, {
        environmentInjector: this.environmentInjector
      });
      this.appRef.attachView(hostCptRef.hostView);
      hostElement.appendChild(hostCptRef.location.nativeElement);

      // 3. Obtém o ViewContainerRef do Host (local onde o conteúdo será injetado)
      const containerRef = hostCptRef.instance.viewContainerRef;

      // 4. Cria o componente filho (o Formulário por exemplo)
      const childCptRef: ComponentRef<T> = containerRef.createComponent(component, {
        environmentInjector: this.environmentInjector
      });

      // 5. Injeta os inputs
      if (inputs) {
        Object.assign(childCptRef.instance, inputs);
      }

      if (typeof (childCptRef.instance as any).checkIfShouldLoad === 'function') {
        (childCptRef.instance as any).checkIfShouldLoad();
      }

      // 6. Injeta a função close no filho
      (childCptRef.instance as any)['close'] = (result?: any) => {
        resolve(result);
        this.appRef.detachView(hostCptRef.hostView);
        hostCptRef.destroy();
        document.body.removeChild(hostElement);
      };
    });
  }
}
