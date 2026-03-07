"use client";

import Link from "next/link";
import { Badge, Button, Card, CardContent, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/app/components/ui";

const imagenes = [
  { id: 1, url: "/img/promo/imagen1.jpg" },
  { id: 2, url: "/img/promo/imagen2.jpg" },
  { id: 3, url: "/img/promo/imagen3.png" },
  { id: 4, url: "/img/promo/imagen4.jpg" },
  { id: 5, url: "/img/promo/imagen5.jpg" },
  { id: 6, url: "/img/promo/imagen6.jpg" },
  { id: 7, url: "/img/promo/imagen7.jpg" },
];

export default function Inicio() {
  return (
    <main className="container-page py-10 md:py-14">
      <section className="space-y-8 md:space-y-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          
          <h1 className="font-bold text-transparent text-6xl sm:text-8xl bg-clip-text bg-gradient-to-r from-red-950 to-orange-500">Dott PC</h1>
          <p className="text-muted-foreground">
            Sumérgete en un mundo de posibilidades infinitas con nuestra exclusiva selección de equipos y accesorios
            gamer. Desde componentes de vanguardia hasta periféricos de alto rendimiento, nuestra tienda es el
            epicentro donde tus sueños de juego toman vida. ¡Juega más allá de los límites y descubre lo que significa
            ser un verdadero jugador!
          </p>
        </div>

        <Card variant="elevated" className="mx-auto w-full max-w-5xl">
          <CardContent className="px-8 py-8">
            <Carousel className="w-full">
              <CarouselContent>
                {imagenes.map((imagen) => (
                  <CarouselItem key={imagen.id} className="flex justify-center">
                    <img
                      src={imagen.url}
                      className="h-auto w-full rounded-lg object-cover shadow-md"
                      alt={`Slide ${imagen.id}`}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
