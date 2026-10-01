import { Redirect } from "expo-router";
import { useSession } from "../state/session";

/** Ruteo por rol, igual que AppInner en la web. */
export default function Inicio() {
  const { usuario } = useSession();
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol === "supervisor") return <Redirect href="/supervisor" />;
  if (usuario.rol === "admin") return <Redirect href="/admin" />;
  return <Redirect href="/direccion" />;
}
