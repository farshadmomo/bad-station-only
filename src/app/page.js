import { CartProvider } from "./components/CartProvider";
import Experience from "./components/Experience";

export default function Home() {
  return (
    <CartProvider>
      <Experience />
    </CartProvider>
  );
}
