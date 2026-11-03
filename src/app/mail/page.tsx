"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/mail/TopBar";
import Sidebar, { MailFolder } from "@/components/mail/Sidebar";
import MailList from "@/components/mail/MailList";
import MailViewer from "@/components/mail/MailViewer";
import ComposeModal, { ComposeInitialData } from "@/components/mail/ComposeModal";
import ConnectWelcome from "@/components/mail/ConnectWelcome";
import { EmailMessageSummary, EmailMessageDetail } from "@/lib/gmail/service";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface Account {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  status: string;
  isDefault: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

function MailDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  const [currentFolder, setCurrentFolder] = useState<MailFolder>("INBOX");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<EmailMessageSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageSummary | null>(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Pagination tokens
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>(undefined);

  const [unreadCount, setUnreadCount] = useState(0);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<ComposeInitialData | null>(null);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notification banners
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Handle URL notifications on load (e.g. from OAuth redirect)
  useEffect(() => {
    const connected = searchParams.get("connected");
    const email = searchParams.get("email");
    const error = searchParams.get("error");

    if (connected === "true" && email) {
      setBanner({
        type: "success",
        message: `¡Cuenta ${email} vinculada exitosamente con Google!`,
      });
      router.replace("/mail");
    } else if (error) {
      setBanner({
        type: "error",
        message: error,
      });
      router.replace("/mail");
    }
  }, [searchParams, router]);

  // Initial load: Fetch authenticated user and linked accounts
  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);

      const accs: Account[] = data.accounts || [];
      setAccounts(accs);

      if (accs.length > 0) {
        const defaultAcc = accs.find((a) => a.isDefault) || accs[0];
        setActiveAccount(defaultAcc || null);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch messages for active account, current folder, search query and pageToken
  const fetchMessages = useCallback(
    async (token?: string, isSilentRefresh = false) => {
      if (!activeAccount) return;

      if (!isSilentRefresh) {
        setLoadingMessages(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const params = new URLSearchParams({
          accountId: activeAccount.id,
          folder: currentFolder,
        });

        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        if (token) {
          params.set("pageToken", token);
        }

        const res = await fetch(`/api/mail/messages?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.accountRevoked) {
            setBanner({
              type: "error",
              message: "El acceso a esta cuenta fue revocado. Por favor vuelve a vincularla.",
            });
          }
          throw new Error(data.error || "Error al cargar mensajes");
        }

        const list: EmailMessageSummary[] = data.messages || [];
        setMessages(list);
        setNextPageToken(data.nextPageToken || null);
        setSelectedIds([]);

        // Count unread in INBOX
        if (currentFolder === "INBOX" && !searchQuery.trim()) {
          const unread = list.filter((m) => m.isUnread).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      } finally {
        setLoadingMessages(false);
        setIsRefreshing(false);
      }
    },
    [activeAccount, currentFolder, searchQuery]
  );

  useEffect(() => {
    if (activeAccount) {
      setCurrentPageToken(undefined);
      setPageHistory([]);
      setSelectedMessage(null);
      fetchMessages(undefined);
    }
  }, [activeAccount, currentFolder, searchQuery, fetchMessages]);

  const handleSelectAccount = (account: Account) => {
    setActiveAccount(account);
    setSelectedMessage(null);
  };

  const handleSelectFolder = (folder: MailFolder) => {
    setCurrentFolder(folder);
    setSearchQuery("");
    setSelectedMessage(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedMessage(null);
  };

  const handleRefresh = () => {
    fetchMessages(currentPageToken, true);
  };

  const handleConnectGmail = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBanner({
          type: "error",
          message: data.error || "No se pudo iniciar la conexión con Google",
        });
      }
    } catch {
      setBanner({
        type: "error",
        message: "Error de red al conectar con Google",
      });
    }
  };

  // Pagination navigation
  const handleNextPage = () => {
    if (!nextPageToken) return;
    setPageHistory((prev) => [...prev, currentPageToken || ""]);
    setCurrentPageToken(nextPageToken);
    fetchMessages(nextPageToken);
  };

  const handlePrevPage = () => {
    if (pageHistory.length === 0) return;
    const prevHistory = [...pageHistory];
    const prevToken = prevHistory.pop();
    setPageHistory(prevHistory);
    setCurrentPageToken(prevToken || undefined);
    fetchMessages(prevToken || undefined);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(messages.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Star toggle
  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    if (!activeAccount) return;
    const action = currentStarred ? "unstar" : "star";

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !currentStarred } : m))
    );

    try {
      await fetch(`/api/mail/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeAccount.id, action }),
      });
    } catch (err) {
      console.error("Failed to toggle star:", err);
      // Revert on error
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isStarred: currentStarred } : m))
      );
    }
  };

  // Quick action on single message
  const handleQuickAction = async (
    id: string,
    action: "markRead" | "markUnread" | "archive" | "trash"
  ) => {
    if (!activeAccount) return;

    if (action === "archive" || action === "trash") {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } else if (action === "markRead" || action === "markUnread") {
      const isUnread = action === "markUnread";
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isUnread } : m))
      );
    }

    try {
      await fetch(`/api/mail/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeAccount.id, action }),
      });
    } catch (err) {
      console.error("Quick action failed:", err);
      fetchMessages(currentPageToken, true);
    }
  };

  // Batch action on selected messages
  const handleBatchAction = async (
    action: "markRead" | "markUnread" | "star" | "unstar" | "archive" | "trash" | "spam"
  ) => {
    if (!activeAccount || selectedIds.length === 0) return;

    const count = selectedIds.length;

    if (action === "archive" || action === "trash" || action === "spam") {
      setMessages((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    } else if (action === "markRead" || action === "markUnread") {
      const isUnread = action === "markUnread";
      setMessages((prev) =>
        prev.map((m) => (selectedIds.includes(m.id) ? { ...m, isUnread } : m))
      );
      setSelectedIds([]);
    } else if (action === "star" || action === "unstar") {
      const isStarred = action === "star";
      setMessages((prev) =>
        prev.map((m) => (selectedIds.includes(m.id) ? { ...m, isStarred } : m))
      );
      setSelectedIds([]);
    }

    try {
      await fetch("/api/mail/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccount.id,
          messageIds: selectedIds,
          action,
        }),
      });

      setBanner({
        type: "success",
        message: `Acción aplicada a ${count} mensajes.`,
      });
    } catch (err) {
      console.error("Batch action failed:", err);
      fetchMessages(currentPageToken, true);
    }
  };

  // Viewer single actions
  const handleViewerAction = async (
    action: "archive" | "trash" | "spam" | "markUnread"
  ) => {
    if (!selectedMessage || !activeAccount) return;
    const msgId = selectedMessage.id;

    setSelectedMessage(null);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));

    try {
      await fetch(`/api/mail/messages/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeAccount.id, action }),
      });
    } catch (err) {
      console.error("Viewer action error:", err);
      fetchMessages(currentPageToken, true);
    }
  };

  // Reply / Forward trigger
  const handleReply = (
    type: "reply" | "replyAll" | "forward",
    detail: EmailMessageDetail
  ) => {
    let toList: string[] = [];
    let ccList: string[] = [];
    let subject = detail.subject || "";

    if (type === "reply") {
      toList = [detail.fromEmail];
      if (!subject.toLowerCase().startsWith("re:")) {
        subject = `Re: ${subject}`;
      }
    } else if (type === "replyAll") {
      toList = [detail.fromEmail];
      if (detail.cc) {
        ccList = detail.cc
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c && c !== activeAccount?.email);
      }
      if (!subject.toLowerCase().startsWith("re:")) {
        subject = `Re: ${subject}`;
      }
    } else if (type === "forward") {
      toList = [];
      if (!subject.toLowerCase().startsWith("fwd:")) {
        subject = `Fwd: ${subject}`;
      }
    }

    const quotedBody = `\n\n\n---------- Mensaje reenviado / respuesta ----------\nDe: ${detail.from}\nFecha: ${detail.date}\nAsunto: ${detail.subject}\nPara: ${detail.to}\n\n${detail.bodyText || ""}`;

    setComposeData({
      to: toList,
      cc: ccList,
      subject,
      bodyHtml: quotedBody,
      threadId: detail.threadId,
      inReplyTo: detail.messageIdHeader,
      references: detail.messageIdHeader,
    });
    setIsComposeOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-600">Cargando Jabvox Mail...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f8fc]">
      {/* Top Bar */}
      <TopBar
        user={user}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        onConnectGmail={handleConnectGmail}
      />

      {/* Notification Toast */}
      {banner && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between transition-all ${
            banner.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-black/20 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentFolder={currentFolder}
          onSelectFolder={handleSelectFolder}
          onOpenCompose={() => {
            setComposeData(null);
            setIsComposeOpen(true);
          }}
          unreadCount={unreadCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white md:rounded-tl-2xl md:mr-3 md:mb-3 shadow-xs border border-gray-200/80">
          {!activeAccount ? (
            <ConnectWelcome
              userName={user.name}
              onConnect={handleConnectGmail}
              loading={isRefreshing}
            />
          ) : selectedMessage ? (
            <MailViewer
              messageSummary={selectedMessage}
              accountId={activeAccount.id}
              onBack={() => {
                setSelectedMessage(null);
                fetchMessages(currentPageToken, true);
              }}
              onAction={handleViewerAction}
              onReply={handleReply}
            />
          ) : (
            <MailList
              messages={messages}
              loading={loadingMessages}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onOpenMessage={(msg) => setSelectedMessage(msg)}
              onToggleStar={handleToggleStar}
              onBatchAction={handleBatchAction}
              onQuickAction={handleQuickAction}
              nextPageToken={nextPageToken}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
              hasPrevPage={pageHistory.length > 0}
              searchActive={Boolean(searchQuery.trim())}
            />
          )}
        </main>
      </div>

      {/* Compose Window Modal */}
      {isComposeOpen && activeAccount && (
        <ComposeModal
          accountId={activeAccount.id}
          initialData={composeData}
          onClose={() => {
            setIsComposeOpen(false);
            setComposeData(null);
          }}
          onSentSuccess={() => {
            setBanner({
              type: "success",
              message: "Mensaje enviado exitosamente.",
            });
            fetchMessages(currentPageToken, true);
          }}
        />
      )}
    </div>
  );
}

export default function MailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MailDashboardContent />
    </Suspense>
  );
}

