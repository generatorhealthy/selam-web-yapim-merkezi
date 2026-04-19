import { Navigate } from "react-router-dom";

// Patient login is now unified with specialist login
export default function PatientLogin() {
  return <Navigate to="/giris-yap" replace />;
}
