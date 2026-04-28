import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

interface Article {
  category: string;
  categoryColor: string;
  date: string;
  title: string;
  description: string;
  image: string;
}

interface QuickCard {
  icon: string;
  label: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [NgFor, NgClass],  // ✅ En lugar de CommonModule
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  filters = ['Todos los temas', 'Piel sensible', 'Consejos', 'Expertos', 'Piel madura', 'Cuidado solar', 'Ingredientes'];
  activeFilter = 'Todos los temas';

  quickCards: QuickCard[] = [
    { icon: '🛡️', label: 'PROTECCIÓN', title: 'SPF todos los días', color: 'card-blue' },
    { icon: '💧', label: 'HIDRATACIÓN', title: 'Texturas ligeras para la mañana', color: 'card-light' },
    { icon: '⭐', label: 'RECOMENDADO', title: 'Rutinas simples y constantes', color: 'card-orange' },
  ];

  articles: Article[] = [
    {
      category: 'GUÍA',
      categoryColor: 'tag-blue',
      date: 'ABRIL 2026',
      title: 'Rutina facial rápida para días ocupados',
      description: 'Tres pasos claros para limpiar, hidratar y proteger la piel sin perder tiempo por la mañana.',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80'
    },
    {
      category: 'CONSEJOS',
      categoryColor: 'tag-orange',
      date: 'MARZO 2026',
      title: 'Cómo elegir una crema que se adapte a tu piel',
      description: 'Qué revisar en la textura, los activos y el nivel de hidratación que tu piel necesita.',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80'
    },
    {
      category: 'EXPERTOS',
      categoryColor: 'tag-gray',
      date: 'FEBRERO 2026',
      title: 'Protección solar durante todo el año',
      description: 'Una explicación simple para no abandonar el protector cuando baja la temperatura.',
      image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&q=80'
    },
  ];

  setFilter(filter: string) {
    this.activeFilter = filter;
  }
}