import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserContextComponent } from './components/user-context/user-context.component';
import { UserContextService } from './services/user-context.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UserContextComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('🛒 ShopTrack');
  protected readonly userContextService = inject(UserContextService);
}
