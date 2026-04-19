import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { profile } from "../api/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        await profile(token);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, []);

  if (isChecking) {
    return <div className="text-white">Checking auth...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
