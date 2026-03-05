"use client";

import React from "react";
import { Button, Card, CardContent, Input } from "@/app/components/ui";

const page = () => {
  return (
    <main className="container-page py-10 md:py-14">
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="space-y-5 px-6 py-8">
          <h1>Contacto</h1>
          <p className="text-muted-foreground">
            Si necesitás asesoramiento sobre productos, completá tu correo y te contactamos.
          </p>
          <Input type="email" label="Email" placeholder="tu@email.com" />
          <div className="flex justify-end">
            <Button variant="primary" className="bg-red-950 text-white hover:bg-red-900">
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default page;
