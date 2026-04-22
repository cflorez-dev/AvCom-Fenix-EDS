import { LinkCardVertical } from './link-card-vertical.js';

export default {
  title: 'Link Card Vertical',
  component: LinkCardVertical,
};

export const Default = () => ({
  component: LinkCardVertical,
  props: {
    title: 'Experiencia avianca',
    description: '¡Listo para despegar! Descubre los servicios a bordo que te ofrecemos al volar con nosotros.',
    image: '/assets/samples/airplane-seat.jpg',
    imageAlt: 'Passenger relaxing in airplane seat',
    linkText: 'Descubre más',
    href: '#',
  },
});

export const WithoutLink = () => ({
  component: LinkCardVertical,
  props: {
    title: 'Equipaje',
    description: 'Entérate de las condiciones que debes tener en cuenta al momento de preparar tu equipaje.',
    image: '/assets/samples/luggage.jpg',
    imageAlt: 'Luggage preparation',
    linkText: 'Conoce más',
  },
});

export const CustomLinkText = () => ({
  component: LinkCardVertical,
  props: {
    title: 'Vuelos especiales',
    description: 'Conoce nuestros destinos únicos y ofertas especiales para tu próximo viaje.',
    image: '/assets/samples/special-flights.jpg',
    imageAlt: 'Special destinations',
    linkText: 'Ver ofertas',
    href: '#special-offers',
  },
});