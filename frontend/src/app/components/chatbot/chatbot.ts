import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  template: '',
  styles: []
})
export class ChatbotComponent implements OnInit, OnDestroy {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      const chatElement = document.querySelector('n8n-chat') || document.querySelector('.n8n-chat');
      if (chatElement) {
        chatElement.remove();
      }
      const script = document.getElementById('n8n-chat-script');
      if (script) {
        script.remove();
      }
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Cargar el CSS de n8n en el head
      const cssId = 'n8n-chat-style';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        document.head.appendChild(link);
      }

      // 2. Inyectar estilos personalizados para que combinen con la página
      const customStyleId = 'n8n-chat-custom-style';
      if (!document.getElementById(customStyleId)) {
        const style = document.createElement('style');
        style.id = customStyleId;
        style.textContent = `
          :root {
            /* Colores de FarmaCode */
            --chat--color--primary: #ff6b00; /* Naranja corporativo */
            --chat--color--primary-shade-50: #e05e00;
            --chat--color--primary--shade-100: #c75300;
            --chat--color--secondary: #0056b3; /* Azul corporativo */
            --chat--color-secondary-shade-50: #004085;
            --chat--color-white: #ffffff;
            --chat--color-light: #f8fafc;
            --chat--color-light-shade-50: #eef2f7;
            --chat--color-light-shade-100: #cbd5e1;
            --chat--color-medium: #94a3b8;
            --chat--color-dark: #0f172a;
            --chat--color-disabled: #cbd5e1;
            --chat--color-typing: #475569;

            /* Bordes redondeados modernos */
            --chat--border-radius: 16px;
            --chat--font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

            /* Ventana de chat */
            --chat--window--border-radius: 20px;
            --chat--window--z-index: 10000;
            --chat--window--box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);

            /* Botón de apertura (Toggle) */
            --chat--toggle--background: #ff6b00;
            --chat--toggle--hover--background: #e05e00;
            --chat--toggle--active--background: #c75300;
            --chat--toggle--size: 60px;

            /* Burbujas de mensajes */
            --chat--message--border-radius: 16px;
            --chat--message--bot--background: #ffffff;
            --chat--message--bot--color: #0f172a;
            --chat--message--bot--border: 1px solid #eef2f7;
            --chat--message--user--background: #0056b3;
            --chat--message--user--color: #ffffff;
          }
        `;
        document.head.appendChild(style);
      }

      // 3. Cargar e inicializar el chat con textos en español
      const scriptId = 'n8n-chat-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        script.text = `
          import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
          createChat({
            webhookUrl: 'https://fanoboi.app.n8n.cloud/webhook/6861956f-322d-4200-8c20-5b2a6d0b846f/chat',
            showWelcomeScreen: true,
            defaultLanguage: 'es',
            initialMessages: [
              '¡Hola! 👋',
              'Bienvenido a FarmaCode. ¿En qué te puedo asesorar hoy?'
            ],
            i18n: {
              es: {
                title: '¡Hola! 👋',
                subtitle: 'Conversa con nuestro asistente de salud 24/7.',
                footer: '',
                getStarted: 'Nueva conversación',
                inputPlaceholder: 'Escribe tu consulta aquí...',
              }
            }
          });
        `;
        document.body.appendChild(script);
      }
    }
  }
}
