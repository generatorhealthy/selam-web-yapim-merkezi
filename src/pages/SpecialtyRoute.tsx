import { useParams } from "react-router-dom";
import { parseLocalSlug } from "@/lib/localSeo";
import SpecialtyPage from "./SpecialtyPage";
import LocalSpecialtyPage from "./LocalSpecialtyPage";

/** /uzmanlik/:specialty — "istanbul-psikolog" / "online-psikolog" gibi adresler yerel sayfayı açar. */
const SpecialtyRoute = () => {
  const { specialty } = useParams();
  return parseLocalSlug(specialty || "") ? <LocalSpecialtyPage key={specialty} /> : <SpecialtyPage />;
};

export default SpecialtyRoute;
