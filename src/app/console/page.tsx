"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Shield,
  Server,
  Key,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  RefreshCw,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe,
  HardDrive,
  Users,
  Building,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectNumber: string;
  status: string;
  serviceConfigs: { serviceName: string; isEnabled: boolean }[];
  providerApps: any[];
}

interface QuotaInfo {
  maxConnectedAccounts: number;
  connectedAccountsCount: number;
  maxDailySends: number;
  sendsToday: number;
  remainingSendsToday: number;
  maxStorageBytes: number;
  currentStorageBytes: number;
}

export default function CloudConsolePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "wizard" | "byo" | "audit">("overview");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [deploymentMode, setDeploymentMode] = useState<"MANAGED" | "BYO">("MANAGED");
  const [selectedProvider, setSelectedProvider] = useState<"GOOGLE" | "MICROSOFT">("GOOGLE");
  const [appName, setAppName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [wizardMessage, setWizardMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Copied alert state
  const [copiedText, setCopiedText] = useState(false);

  const redirectUri =
    typeof window !== "undefined"
      ? selectedProvider === "GOOGLE"
        ? `${window.location.origin}/api/auth/google/callback`
        : `${window.location.origin}/api/auth/microsoft/callback`
      : "";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, projectsRes] = await Promise.all([
        fetch("/api/provisioning/status"),
        fetch("/api/projects"),
      ]);

      if (statusRes.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setQuota(statusData.quota);
        setConnectedAccounts(statusData.accounts || []);
        setUser(statusData.user);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
        if (projectsData.projects?.length > 0) {
          setSelectedProject((prev) => prev || projectsData.projects[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching console data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyUri = () => {
    if (!redirectUri) return;
    navigator.clipboard.writeText(redirectUri);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setIsCreatingProject(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [data.project, ...prev]);
        setSelectedProject(data.project);
        setNewProjectName("");
        setShowNewProjectModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Error al crear el proyecto");
      }
    } catch (err) {
      alert("Error de conexión al crear el proyecto");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSaveByoApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      alert("Debes seleccionar o crear un proyecto primero.");
      return;
    }

    try {
      setIsSubmittingApp(true);
      setWizardMessage(null);

      const res = await fetch(`/api/projects/${selectedProject.id}/apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          name: appName.trim() || `${selectedProvider} BYO Credentials`,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          redirectUri,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setWizardMessage({
          type: "success",
          text: "¡Credenciales validadas y cifradas en AES-256 exitosamente!",
        });
        setWizardStep(4);
        fetchData();
      } else {
        setWizardMessage({
          type: "error",
          text: data.error || "Error al registrar credenciales",
        });
      }
    } catch (err) {
      setWizardMessage({
        type: "error",
        text: "Error de red al conectar con el servidor",
      });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Google Cloud-style Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">JABVOX</span>
              <span className="text-slate-400 text-xs ml-1 font-medium">Cloud Console</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Proyecto:</span>
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectNumber})
                </option>
              ))}
              {projects.length === 0 && <option value="">Proyecto Predeterminado</option>}
            </select>

            <button
              onClick={() => setShowNewProjectModal(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 border border-slate-700"
              title="Crear nuevo proyecto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/mail"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#15605A] text-white hover:bg-[#114b46] transition-all shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Ir al Webmail</span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </Link>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition-colors ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-800 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Panel de Control & Cuotas</span>
          </button>

          <button
            onClick={() => setActiveTab("wizard")}
            className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition-colors ${
              activeTab === "wizard"
                ? "border-emerald-600 text-emerald-800 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Asistente de Aprovisionamiento</span>
          </button>

          <button
            onClick={() => setActiveTab("byo")}
            className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center gap-2 transition-colors ${
              activeTab === "byo"
                ? "border-emerald-600 text-emerald-800 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Credenciales & BYO-Cloud</span>
          </button>
        </nav>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Actualizar estado"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Project Status Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedProject?.name || "Proyecto Principal"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ACTIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Número de Recurso:{" "}
                    <code className="text-slate-700 font-mono font-semibold">
                      {selectedProject?.projectNumber || "jbx-94821"}
                    </code>{" "}
                    &bull; Aislamiento lógico independiente
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("wizard")}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aprovisionar Nueva Cuenta</span>
                </button>
              </div>
            </div>

            {/* Quota & Usage Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Daily Sends Metric Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Envíos en 24 Horas
                  </span>
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900">
                    {quota?.sendsToday ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {quota?.maxDailySends ?? 500} permitidos
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((quota?.sendsToday ?? 0) / (quota?.maxDailySends ?? 500)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {quota?.remainingSendsToday ?? 500} envíos restantes para hoy.
                </p>
              </div>

              {/* Connected Accounts Metric Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cuentas Vinculadas
                  </span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900">
                    {quota?.connectedAccountsCount ?? connectedAccounts.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {quota?.maxConnectedAccounts ?? 5} máx. permitidas
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((quota?.connectedAccountsCount ?? 0) /
                          (quota?.maxConnectedAccounts ?? 5)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Cada cuenta tiene tokens cifrados con AES-256 independientes.
                </p>
              </div>

              {/* Storage Quota Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Almacenamiento Lógico
                  </span>
                  <HardDrive className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900">
                    {((quota?.currentStorageBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <span className="text-xs text-slate-400">
                    / {((quota?.maxStorageBytes ?? 10737418240) / (1024 * 1024 * 1024)).toFixed(0)} GB
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: "2%" }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Cuota asignada para adjuntos y metadatos.
                </p>
              </div>
            </div>

            {/* Connected Mailboxes Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buzones y Cuentas Conectadas</h3>
                  <p className="text-xs text-slate-500">
                    Cada buzón opera con identidad y tokens OAuth propios e independientes.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Correo Electrónico</th>
                      <th className="py-3 px-5">Proveedor</th>
                      <th className="py-3 px-5">Estado</th>
                      <th className="py-3 px-5">Tokens & Seguridad</th>
                      <th className="py-3 px-5">Predeterminada</th>
                      <th className="py-3 px-5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {connectedAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {acc.email}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="capitalize px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700">
                            {acc.provider}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              acc.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {acc.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AES-256-GCM</span>
                        </td>
                        <td className="py-3.5 px-5">
                          {acc.isDefault ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sí
                            </span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href="/mail"
                            className="font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            Abrir Bandeja
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {connectedAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No tienes cuentas de correo conectadas en este proyecto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Tab */}
        {activeTab === "wizard" && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs max-w-3xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4" />
                <span>Asistente de Incorporación Oficial</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Aprovisionamiento de Cuenta de Correo y Calendario
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configura tu conexión directa con Google o Microsoft. Cada cuenta mantiene
                aislamiento estricto, sin compartir credenciales con otros clientes.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between border-y border-slate-200 py-3 text-xs font-semibold">
              <span className={wizardStep === 1 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                1. Modo de Despliegue
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              <span className={wizardStep === 2 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                2. Proveedor Oficial
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              <span className={wizardStep === 3 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                3. Credenciales
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              <span className={wizardStep === 4 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                4. Activación
              </span>
            </div>

            {wizardMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  wizardMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {wizardMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{wizardMessage.text}</span>
              </div>
            )}

            {/* Wizard Step 1: Deployment Mode */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Selecciona la modalidad de aprovisionamiento:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setDeploymentMode("MANAGED")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      deploymentMode === "MANAGED"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        Jabvox Managed Cloud
                      </span>
                      <Server className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Conexión rápida. Tu cuenta se aprovisiona inmediatamente bajo las
                      aplicaciones verificadas de Jabvox con cuotas asignadas.
                    </p>
                  </div>

                  <div
                    onClick={() => setDeploymentMode("BYO")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      deploymentMode === "BYO"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        BYO-Cloud (Infraestructura Propia)
                      </span>
                      <Key className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Para empresas y organizaciones. Conecta tu propio proyecto de Google Cloud o
                      Azure con tu propio Client ID y Client Secret.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Step 2: Provider Selection */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Selecciona el proveedor de servicios:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setSelectedProvider("GOOGLE")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedProvider === "GOOGLE"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Google Cloud</span>
                      <Globe className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Gmail API, Google Calendar API y generación de reuniones Google Meet.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedProvider("MICROSOFT")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedProvider === "MICROSOFT"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        Microsoft Entra ID
                      </span>
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Microsoft Graph API, Outlook, Hotmail y Office 365 con permisos delegados.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={() => {
                      if (deploymentMode === "MANAGED") {
                        // Modo administrado: saltar directo al paso de conexión
                        setWizardStep(4);
                      } else {
                        setWizardStep(3);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Step 3: BYO Credentials Input */}
            {wizardStep === 3 && (
              <form onSubmit={handleSaveByoApp} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Configura tus credenciales de {selectedProvider === "GOOGLE" ? "Google Cloud Console" : "Azure Portal"}:
                </h3>

                {/* Redirect URI copy box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">
                    URI de redireccionamiento autorizada (Copia y pega en tu consola):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={redirectUri}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUri}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedText ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedText ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Descriptivo de la Aplicación
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mi Empresa Google App"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client ID Oficial
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    El secreto se cifra inmediatamente con AES-256-GCM antes de guardarse.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isSubmittingApp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Validar y Guardar Credenciales</span>
                  </button>
                </div>
              </form>
            )}

            {/* Wizard Step 4: Final Connect / Activation */}
            {wizardStep === 4 && (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Infraestructura Lista para Conectar
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Haz clic en el botón inferior para abrir la pantalla oficial de consentimiento de{" "}
                    {selectedProvider === "GOOGLE" ? "Google" : "Microsoft"} y autorizar tu buzón.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={
                      selectedProvider === "GOOGLE"
                        ? "/api/auth/google/url"
                        : "/api/auth/microsoft/url"
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#15605A] to-[#1e7a72] text-white font-bold text-xs shadow-md shadow-[#15605A]/20 hover:scale-[1.02] transition-all"
                  >
                    <span>Conectar mi Cuenta Oficial de {selectedProvider === "GOOGLE" ? "Google" : "Microsoft"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-center">
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setActiveTab("overview");
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Volver al Panel de Control
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: BYO Cloud Applications */}
        {activeTab === "byo" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Credenciales de Infraestructura (BYO-Cloud)
                </h3>
                <p className="text-xs text-slate-500">
                  Administra las claves y aplicaciones OAuth asignadas al proyecto{" "}
                  <span className="font-semibold text-slate-700">{selectedProject?.name}</span>.
                </p>
              </div>
              <button
                onClick={() => {
                  setDeploymentMode("BYO");
                  setWizardStep(3);
                  setActiveTab("wizard");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Credenciales BYO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-sm text-slate-900">Google Cloud Platform</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    HABILITADO
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Servicios activos: Gmail API v1, Google Calendar API v3, Google Meet.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Modo: Producción Jabvox</span>
                  <span className="font-mono text-slate-700">AES-256 Validado</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900">Microsoft Entra ID</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    HABILITADO
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Servicios activos: Microsoft Graph API (Outlook & Calendar).
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Modo: Multi-tenant Delegado</span>
                  <span className="font-mono text-slate-700">AES-256 Validado</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Crear Nuevo Proyecto</h3>
              <p className="text-xs text-slate-500 mt-1">
                Los proyectos aíslan buzones, cuotas y credenciales de forma independiente.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ventas Corporativas"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isCreatingProject ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Crear Proyecto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
