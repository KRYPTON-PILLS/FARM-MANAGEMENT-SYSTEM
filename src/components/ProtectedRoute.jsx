import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌿</div>
          <p className="text-green-300 font-semibold text-lg">Loading Farm System...</p>
          <div className="mt-4 flex justify-center gap-1.5">
            {[0,1,2].map((i)=>(
              <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                style={{animationDelay:`${i*0.15}s`}}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" replace />;
}
