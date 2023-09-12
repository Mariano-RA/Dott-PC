import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Inicio from "./home/Page";

export default function Home() {
  return (
    <main className="flex flex-col bg-black marker:w-full min-h-screen justify-between">
      <Navbar />
      <div className="flex flex-grow">
        <Inicio />
      </div>
      <Footer />
    </main>
  );
}
