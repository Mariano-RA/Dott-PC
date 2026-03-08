import Link from "next/link";
import React from "react";
import { Button, Card, CardContent } from "@/components/ui";

export default function ProductsEmptyState({
  title = "No encontramos productos",
  description = "No hay resultados para los filtros seleccionados.",
}) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link href="/products/list">
            <Button variant="secondary" size="md">Ver todos los productos</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
