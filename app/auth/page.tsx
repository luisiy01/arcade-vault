"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthPage() {
  const [tab, setTab] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ name: (username || "PLAYER1").toUpperCase().slice(0, 10) });
    router.push("/");
  };

  const handleGuest = () => {
    login({ name: "INVITADO" });
    router.push("/");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => setTab("in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => setTab("up")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Usuario</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="px_kai"
            />
          </div>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Correo electrónico</label>
              <input type="email" placeholder="jugador@vault.gg" />
            </div>
          )}
          <div className="field">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button
            className="btn lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
          >
            {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button
          className="btn ghost"
          type="button"
          style={{ width: "100%", marginTop: 10 }}
          onClick={handleGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
