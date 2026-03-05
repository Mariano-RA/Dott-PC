import React from "react";
import { Button, Card, CardContent } from "@/app/components/ui";

export default function ProductsErrorState({
  message = "No pudimos cargar los productos. Intenta nuevamente.",
  onRetry,
}) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-lg font-semibold text-foreground">Ocurrio un error</p>
        <p className="max-w-xl text-sm text-muted-foreground">{message}</p>
        <Button variant="primary" size="md" onClick={onRetry}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}
