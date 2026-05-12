import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MealsPage from "./pages/MealsPage";
import ProductsPage from "./pages/ProductsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem("token"));

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex gap-6">
            {!hasToken ? (
              <Link to="/login" className="hover:text-zinc-300">
                Login
              </Link>
            ) : null}

            <Link
              to="/meals"
              className={location.pathname === "/meals" ? "text-white" : "hover:text-zinc-300"}
            >
              Meals
            </Link>

            <Link
              to="/products"
              className={
                location.pathname === "/products" ? "text-white" : "hover:text-zinc-300"
              }
            >
              Products
            </Link>
          </nav>

          {hasToken ? (
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900"
            >
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/meals"
            element={
              <ProtectedRoute>
                <MealsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <MealsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
