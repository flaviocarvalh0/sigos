import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group
} from '@angular/animations';


@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    styleUrls: ['./app.component.css'],
    template: '<router-outlet></router-outlet>',
    animations: [
        trigger('routeAnimations', [
            transition('* <=> *', [
                query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
                group([
                    query(':enter', [
                        style({ opacity: 0 }),
                        animate('400ms ease-in-out', style({ opacity: 1 }))
                    ], { optional: true }),
                    query(':leave', [
                        style({ opacity: 1 }),
                        animate('400ms ease-in-out', style({ opacity: 0 }))
                    ], { optional: true }),
                ])
            ])
        ])
    ]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
  title = 'sigos';
}
