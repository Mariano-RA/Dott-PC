import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 w-full bg-red-950 text-red-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-100">
            Atencion al cliente
          </h3>
          <p className="text-sm text-red-50">
            <a href="tel:+543512861992" className="hover:underline">
              351-2861992
            </a>
          </p>
          <p className="text-sm text-red-50">
            <a href="mailto:dott.computacion@gmail.com" className="hover:underline">
              dott.computacion@gmail.com
            </a>
          </p>
          <div className="pt-2">
            <Link href="/contact" className="text-sm text-red-50 hover:underline">
              Contacto
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-100">
            Dott PC
          </h3>
          <p className="text-sm text-red-200">Retiro de pedidos en Cordoba</p>
          <p className="text-sm text-red-200">Lunes a viernes de 8 a 18 hs</p>
          <p className="text-sm text-red-200">Lunes a viernes de 10 a 18 hs</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-100">
            Navegacion
          </h3>
          <Link href="/products/list/" className="block text-sm text-red-50 hover:underline">
            Productos
          </Link>
          <Link href="/calculadora" className="block text-sm text-red-50 hover:underline">
            Calculadora
          </Link>
          <Link href="/" className="block text-sm text-red-50 hover:underline">
            Inicio
          </Link>
        </div>
      </div>

      <div className="border-t border-red-900/90 px-4 py-4 text-center text-xs text-red-200 sm:px-6 lg:px-8">
        Copyright {year} - DottPC. Cordoba, Argentina.
      </div>
    </footer>
  );
};

export default Footer;
