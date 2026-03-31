import { Link, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MealsPage from "./pages/MealsPage";
import ProductsPage from "./pages/ProductsPage";

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <nav className="mx-auto flex max-w-5xl gap-6 px-6 py-4">
          <Link to="/login" className="hover:text-zinc-300">
            Login
          </Link>
          <Link to="/meals" className="hover:text-zinc-300">
            Meals
          </Link>
          <Link to="/products" className="hover:text-zinc-300">
            Products
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="*" element={<MealsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
