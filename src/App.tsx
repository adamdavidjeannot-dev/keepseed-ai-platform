import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Key, 
  BookOpen, 
  CreditCard, 
  Activity, 
  Bot,
  HelpCircle,
  Tag,
  MessageSquare,
  User,
  ChevronRight,
  Plus,
  Send,
  Paperclip,
  Globe,
  Zap,
  Award,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Play
} from 'lucide-react';
import './App.css';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  permissions: 'Full Access' | 'Read Only';
  status: 'Active' | 'Revoked';
}

interface ServerConfig {
  publishableKey: string;
  accountId: string;
  prices: {
    starter: string;
    pro: string;
  };
  currency: string;
  taxEnabled: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Server configuration
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    publishableKey: '',
    accountId: '',
    prices: {
      starter: 'price_1U5VUcDy28wjEXYsN7AwEJMb',
      pro: 'price_1U5VUcDy28wjEXYsMwd5Ltxo'
    },
    currency: 'usd',
    taxEnabled: false
  });

  // Top Up States
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CNY'>('USD');
  const [amount, setAmount] = useState<number>(20);
  const [customAmountInput, setCustomAmountInput] = useState<string>('20');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'gpay' | 'card'>('stripe');

  // Pricing Interval State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Chat UI States
  const [modelType, setModelType] = useState<'instant' | 'expert' | 'vision'>('instant');
  const [deepThinkEnabled, setDeepThinkEnabled] = useState<boolean>(false);
  const [searchEnabled, setSearchEnabled] = useState<boolean>(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Docs Code Snippets State
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'nodejs' | 'go'>('curl');
  const [apiTesterEndpoint, setApiTesterEndpoint] = useState<string>('/api/v1/topup');
  const [apiTesterResponse, setApiTesterResponse] = useState<string | null>(null);

  // API Key Management States
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_1',
      name: 'Production Server Backend',
      prefix: 'kp_live_9f81...4d2e',
      created: '2026-08-01',
      lastUsed: 'Just now',
      permissions: 'Full Access',
      status: 'Active',
    },
    {
      id: 'key_2',
      name: 'Dev Agent Local',
      prefix: 'kp_test_3a12...89bc',
      created: '2026-08-10',
      lastUsed: '3 hours ago',
      permissions: 'Full Access',
      status: 'Active',
    },
    {
      id: 'key_3',
      name: 'Analytics Read-Only',
      prefix: 'kp_live_0b77...11a9',
      created: '2026-07-20',
      lastUsed: '2 days ago',
      permissions: 'Read Only',
      status: 'Revoked',
    }
  ]);
  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKeyPerms, setNewKeyPerms] = useState<'Full Access' | 'Read Only'>('Full Access');
  const [generatedSecretKey, setGeneratedSecretKey] = useState<string | null>(null);

  // FAQ Accordion States
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Synchronize initial configuration & handle URL parameters
  useEffect(() => {
    // 1. Fetch public configuration
    fetch('/api/config')
      .then((res) => res.json())
      .then((data: ServerConfig) => {
        if (data.prices) {
          setServerConfig(data);
        }
      })
      .catch((err) => console.warn('Could not fetch server config:', err));

    // 2. Parse URL parameters (Stripe return handling)
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    const isSuccess = query.get('success');
    const pathname = window.location.pathname.replace('/', '');

    if (pathname && ['chat', 'usage', 'api-keys', 'top-up', 'billing', 'docs', 'help', 'pricing'].includes(pathname)) {
      setActiveTab(pathname);
    }

    if (isSuccess === 'true') {
      if (sessionId) {
        fetch(`/api/checkout-session/${sessionId}`)
          .then((res) => res.json())
          .then((details) => {
            setNotification({
              type: 'success',
              message: `Payment successful! Verified Stripe Session: ${details.id}. Total: $${details.amount_total || '0.00'}.`
            });
          })
          .catch(() => {
            setNotification({
              type: 'success',
              message: 'Payment completed successfully! Your balance / subscription is now active.'
            });
          });
      } else {
        setNotification({
          type: 'success',
          message: 'Payment completed successfully! Your balance / subscription is now active.'
        });
      }

      // Remove query parameters from address bar cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const calculateTotal = (amt: number) => {
    const vat = amt * 0.06;
    return (amt + vat).toFixed(2);
  };

  const handleSendMessage = (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text: prompt, time }]);
    setInputPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      let simulatedReply = '';
      if (modelType === 'expert') {
        simulatedReply = `Keepseed Expert (o3-class): Analysis complete for "${prompt}".\n\n- Reasoning Depth: ${deepThinkEnabled ? 'High (8,192 thought tokens)' : 'Standard'}\n- Live Grounding: ${searchEnabled ? 'Web index search synthesized' : 'Internal weights only'}\n\nKey finding: System architecture demonstrates high concurrency resilience with sub-50ms token latency.`;
      } else if (modelType === 'vision') {
        simulatedReply = `Keepseed Vision: Multimodal input processing ready. Analyzed context for query: "${prompt}". Input stream verified at 128k context window.`;
      } else {
        simulatedReply = `Keepseed Instant (4o-class): Here is the immediate resolution for "${prompt}". All model nodes are operating at normal latency.`;
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          text: simulatedReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckoutTopUp = async () => {
    try {
      setLoadingAction('topup');
      const res = await fetch('/api/create-topup-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          currency: selectedCurrency.toLowerCase(),
          customerEmail: 'user@example.com' 
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to initiate Stripe top-up checkout.'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Top-Up Checkout error: ${err.message || 'Network connection failed'}`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckoutSubscription = async (planKey: 'starter' | 'pro') => {
    try {
      setLoadingAction(`sub_${planKey}`);
      const priceId = planKey === 'starter' ? serverConfig.prices.starter : serverConfig.prices.pro;

      const res = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          customerEmail: 'user@example.com' 
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to initiate subscription checkout.'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Subscription error: ${err.message || 'Network connection failed'}`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      setLoadingAction('portal');
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: 'cus_demo_id',
          customerEmail: 'user@example.com'
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setNotification({
          type: 'warning',
          message: data.error || 'Customer portal unavailable. Please verify your billing details.'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Customer Portal error: ${err.message || 'Network connection failed'}`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fullKey = `kp_live_${randomSuffix}${Math.random().toString(36).substring(2, 18)}`;
    const prefix = `${fullKey.substring(0, 11)}...${fullKey.substring(fullKey.length - 4)}`;

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      permissions: newKeyPerms,
      status: 'Active',
    };

    setApiKeys([newKey, ...apiKeys]);
    setGeneratedSecretKey(fullKey);
    setNewKeyName('');
    setShowNewKeyModal(false);
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys(apiKeys.map((k) => (k.id === keyId ? { ...k, status: 'Revoked' } : k)));
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== keyId));
  };

  const handleRunApiTest = async () => {
    setLoadingAction('test_api');
    try {
      const res = await fetch(apiTesterEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 20,
          currency: 'usd'
        })
      });
      const data = await res.json();
      setApiTesterResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiTesterResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingAction(null);
    }
  };

  const getCodeSnippet = () => {
    if (codeTab === 'curl') {
      return `curl https://api.keepseed.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${KEEPSEED_API_KEY}" \\
  -d '{
    "model": "keepseed-v4-pro",
    "messages": [
      {"role": "system", "content": "You are a specialized AI assistant."},
      {"role": "user", "content": "Analyze current system latency metrics."}
    ],
    "thinking": {"type": "enabled"},
    "reasoning_effort": "high",
    "stream": false
  }'`;
    }
    if (codeTab === 'python') {
      return `import os
from openai import OpenAI

# Initialize client pointing to Keepseed API endpoint
client = OpenAI(
    api_key=os.environ.get("KEEPSEED_API_KEY"),
    base_url="https://api.keepseed.io/v1"
)

response = client.chat.completions.create(
    model="keepseed-v4-pro",
    messages=[
        {"role": "system", "content": "You are a specialized AI assistant."},
        {"role": "user", "content": "Analyze current system latency metrics."},
    ],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

print(response.choices[0].message.content)`;
    }
    if (codeTab === 'nodejs') {
      return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.keepseed.io/v1",
  apiKey: process.env.KEEPSEED_API_KEY,
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "keepseed-v4-pro",
    messages: [
      { role: "system", content: "You are a specialized AI assistant." },
      { role: "user", content: "Analyze current system latency metrics." }
    ],
    stream: false,
  });

  console.log(completion.choices[0].message.content);
}

main();`;
    }
    return `package main

import (
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig(os.Getenv("KEEPSEED_API_KEY"))
	config.BaseURL = "https://api.keepseed.io/v1"
	client := openai.NewClientWithConfig(config)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "keepseed-v4-pro",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Analyze current system latency metrics.",
				},
			},
		},
	)
	if err != nil {
		fmt.Printf("ChatCompletion error: %v\\n", err)
		return
	}

	fmt.Println(resp.Choices[0].Message.Content)
}`;
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Bot size={20} />
          </div>
          <span className="brand-title">Keepseed</span>
          <span className="brand-badge">v1.0</span>
        </div>

        <button 
          onClick={() => {
            setActiveTab('chat');
            setMessages([]);
            setMobileMenuOpen(false);
          }}
          className="new-chat-btn"
        >
          <Plus size={16} />
          <span>New chat</span>
        </button>

        <ul className="nav-list">
          <li 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => { setActiveTab('usage'); setMobileMenuOpen(false); }}
          >
            <Activity size={18} />
            <span>Usage & Metrics</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => { setActiveTab('api-keys'); setMobileMenuOpen(false); }}
          >
            <Key size={18} />
            <span>API Keys</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'top-up' ? 'active' : ''}`}
            onClick={() => { setActiveTab('top-up'); setMobileMenuOpen(false); }}
          >
            <CreditCard size={18} />
            <span>Top Up Credits</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('billing'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Billing & Invoices</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('docs'); setMobileMenuOpen(false); }}
          >
            <BookOpen size={18} />
            <span>Developer Docs</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pricing'); setMobileMenuOpen(false); }}
          >
            <Tag size={18} />
            <span>Pricing Plans</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => { setActiveTab('help'); setMobileMenuOpen(false); }}
          >
            <HelpCircle size={18} />
            <span>Help & FAQ</span>
          </li>
        </ul>

        <div className="sidebar-user">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <div className="user-name">Developer Account</div>
            <div className="user-email">user@example.com</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button 
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="header-title">
              {activeTab === 'chat' && 'AI Interface'}
              {activeTab === 'usage' && 'Usage Analytics'}
              {activeTab === 'api-keys' && 'API Key Management'}
              {activeTab === 'top-up' && 'Top Up Balance'}
              {activeTab === 'billing' && 'Billing & Subscription'}
              {activeTab === 'docs' && 'Developer Documentation'}
              {activeTab === 'pricing' && 'Pricing & Plans'}
              {activeTab === 'help' && 'Help & FAQ'}
            </div>
          </div>

          <div className="header-right">
            <div className="status-indicator">
              <div className="status-dot" />
              <span>API Online</span>
            </div>
          </div>
        </header>

        {/* Global Toast Alert */}
        {notification && (
          <div style={{ padding: '1rem 2rem 0' }}>
            <div className={`toast-banner toast-${notification.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} />
                <span>{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 1. CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="chat-wrapper">
            {/* Header Model Selector */}
            <div className="chat-header">
              <div className="model-pill-selector">
                <button
                  className={`model-pill-btn ${modelType === 'instant' ? 'active' : ''}`}
                  onClick={() => setModelType('instant')}
                >
                  <Zap size={14} /> Instant
                </button>
                <button
                  className={`model-pill-btn ${modelType === 'expert' ? 'active' : ''}`}
                  onClick={() => setModelType('expert')}
                >
                  <Award size={14} /> Expert
                </button>
                <button
                  className={`model-pill-btn ${modelType === 'vision' ? 'active' : ''}`}
                  onClick={() => setModelType('vision')}
                >
                  <Eye size={14} /> Vision
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="chat-history">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon">
                    <Sparkles size={28} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Start Prompting with Keepseed</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    Select an operational model, enable reasoning or web search, and execute queries across our enterprise infrastructure.
                  </p>

                  <div className="chat-prompt-suggestions">
                    <div 
                      className="suggestion-card"
                      onClick={() => handleSendMessage('Create a secure Stripe webhook signature validator in Node.js')}
                    >
                      <div className="suggestion-title">Stripe Webhook Validator</div>
                      <div className="suggestion-desc">Generate production raw-body handler</div>
                    </div>
                    <div 
                      className="suggestion-card"
                      onClick={() => handleSendMessage('Write a Python script for OpenAI SDK client setup on custom endpoint')}
                    >
                      <div className="suggestion-title">SDK Client Config</div>
                      <div className="suggestion-desc">Connect custom baseURL & token streaming</div>
                    </div>
                    <div 
                      className="suggestion-card"
                      onClick={() => handleSendMessage('Explain rate limits & token bucket implementation for multi-tenant APIs')}
                    >
                      <div className="suggestion-title">Rate Limit Architecture</div>
                      <div className="suggestion-desc">Token bucket & concurrency algorithms</div>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message-bubble-group ${msg.role}`}>
                    <div className={`message-avatar ${msg.role}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="message-content-wrapper">
                      <div className={`message-bubble ${msg.role}`}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      </div>
                      <div className="message-meta">
                        <span>{msg.time}</span>
                        {msg.role === 'assistant' && (
                          <button 
                            onClick={() => handleCopyCode(msg.text)}
                            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <Copy size={11} /> copy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="message-bubble-group assistant">
                  <div className="message-avatar assistant">
                    <Bot size={16} />
                  </div>
                  <div className="message-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Generating response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="chat-input-container">
              <div className="chat-input-box">
                <textarea
                  className="chat-textarea"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Message Keepseed (${modelType.toUpperCase()} mode)...`}
                  rows={2}
                />

                <div className="chat-controls-bar">
                  <div className="chat-feature-toggles">
                    <button
                      className={`toggle-pill-btn ${deepThinkEnabled ? 'active' : ''}`}
                      onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                    >
                      <Sparkles size={12} />
                      <span>DeepThink</span>
                    </button>
                    <button
                      className={`toggle-pill-btn ${searchEnabled ? 'active' : ''}`}
                      onClick={() => setSearchEnabled(!searchEnabled)}
                    >
                      <Globe size={12} />
                      <span>Search</span>
                    </button>
                  </div>

                  <div className="chat-action-btns">
                    <button className="icon-btn" title="Attach context file">
                      <Paperclip size={18} />
                    </button>
                    <button 
                      className="send-btn"
                      onClick={() => handleSendMessage()}
                      disabled={!inputPrompt.trim() || isTyping}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USAGE TAB */}
        {activeTab === 'usage' && (
          <div className="page-container">
            <div className="page-header">
              <h1 className="page-title">Usage & Performance Analytics</h1>
              <p className="page-subtitle">Inspect token volume, rate limits, and model consumption distribution across your organization.</p>
            </div>

            <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>MONTHLY TOKEN USAGE</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: '#60a5fa' }}>4,821,900</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                  <span>↑ 14.2%</span>
                  <span style={{ color: 'var(--text-muted)' }}>vs previous 30-day window</span>
                </div>
              </div>

              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>ACTIVE API KEYS</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{apiKeys.filter(k => k.status === 'Active').length} Active</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authorized for production & dev</div>
              </div>

              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>RATE LIMIT QUOTA (RPM)</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: '#10b981' }}>10,000 RPM</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tier 3 Enterprise concurrency</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">
                <Activity size={18} />
                <span>Model Distribution Breakdown</span>
              </div>
              <p className="card-description" style={{ marginBottom: '1.25rem' }}>
                Proportional breakdown of request volume dispatched per model endpoint.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 600 }}>Keepseed Instant (4o-Class)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>2,989,578 tokens (62%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '62%', height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 600 }}>Keepseed Expert (o3/DeepThink)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>1,350,132 tokens (28%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '28%', height: '100%', background: '#8b5cf6', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 600 }}>Keepseed Vision (Multimodal)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>482,190 tokens (10%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '10%', height: '100%', background: '#10b981', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. API KEYS TAB */}
        {activeTab === 'api-keys' && (
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="page-title">API Secret Keys</h1>
                <p className="page-subtitle">Create and manage secret credentials used to authenticate programmatic requests.</p>
              </div>
              <button 
                onClick={() => setShowNewKeyModal(true)} 
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Create New Key</span>
              </button>
            </div>

            {/* Generated Key Alert */}
            {generatedSecretKey && (
              <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <ShieldCheck size={18} />
                  <span>New API Key Generated Successfully</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Please copy your secret key now. For security purposes, you will not be able to view it again.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedSecretKey} 
                    style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '0.8125rem' }} 
                  />
                  <button 
                    onClick={() => handleCopyCode(generatedSecretKey)}
                    className="btn btn-secondary"
                  >
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button 
                    onClick={() => setGeneratedSecretKey(null)}
                    className="btn btn-secondary"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>KEY PREFIX</th>
                    <th>CREATED</th>
                    <th>LAST USED</th>
                    <th>PERMISSIONS</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td style={{ fontWeight: 600 }}>{k.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{k.prefix}</td>
                      <td>{k.created}</td>
                      <td>{k.lastUsed}</td>
                      <td>
                        <span className="badge badge-primary">{k.permissions}</span>
                      </td>
                      <td>
                        <span className={`badge ${k.status === 'Active' ? 'badge-success' : 'badge-muted'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          {k.status === 'Active' && (
                            <button 
                              onClick={() => handleRevokeKey(k.id)}
                              className="btn btn-secondary btn-sm"
                              title="Revoke Key"
                            >
                              Revoke
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteKey(k.id)}
                            className="btn btn-danger btn-sm"
                            title="Delete Key"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Key Modal */}
            {showNewKeyModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Create New Secret Key</h3>
                    <button 
                      onClick={() => setShowNewKeyModal(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateApiKey}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                        Key Name / Identifier
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Production Cluster Service"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                        Access Permissions Scope
                      </label>
                      <select 
                        value={newKeyPerms}
                        onChange={(e) => setNewKeyPerms(e.target.value as any)}
                        style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                      >
                        <option value="Full Access">Full Access (Read & Write & Inference)</option>
                        <option value="Read Only">Read Only (Analytics & Metrics)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowNewKeyModal(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                      >
                        Generate Secret Key
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TOP UP TAB */}
        {activeTab === 'top-up' && (
          <div className="page-container" style={{ maxWidth: '680px' }}>
            <div className="page-header">
              <h1 className="page-title">Top Up Prepaid Credits</h1>
              <p className="page-subtitle">Recharge your API credit balance for uninterrupted model inference & endpoint queries.</p>
            </div>

            {/* Currency Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setSelectedCurrency('USD')}
                className={`btn btn-sm ${selectedCurrency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
              >
                USD ($)
              </button>
              <button 
                onClick={() => setSelectedCurrency('CNY')}
                className={`btn btn-sm ${selectedCurrency === 'CNY' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
              >
                CNY (¥)
              </button>
            </div>

            {/* Amount Selection Chips */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Select Recharge Amount
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[5, 10, 20, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setAmount(val);
                      setCustomAmountInput(String(val));
                    }}
                    style={{
                      padding: '0.625rem 0.5rem',
                      borderRadius: '8px',
                      border: `1px solid ${amount === val ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: amount === val ? 'var(--accent-subtle)' : 'var(--bg-card)',
                      color: amount === val ? '#60a5fa' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Custom:</span>
                <input 
                  type="number"
                  min="1"
                  max="10000"
                  value={customAmountInput}
                  onChange={(e) => {
                    setCustomAmountInput(e.target.value);
                    const num = Number(e.target.value);
                    if (!isNaN(num) && num > 0) setAmount(num);
                  }}
                  style={{ width: '120px', padding: '0.375rem 0.625rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Total Summary Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>TOTAL CHECKOUT AMOUNT</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>
                ${calculateTotal(amount)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertCircle size={14} />
                <span>Base amount ${amount.toFixed(2)} + VAT / processing (6%) ${(amount * 0.06).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div 
                  onClick={() => setPaymentMethod('stripe')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${paymentMethod === 'stripe' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'stripe' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={18} color="#60a5fa" />
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Stripe Dynamic Checkout (Cards, Google Pay, Apple Pay, Link)</span>
                  </div>
                  <input type="radio" checked={paymentMethod === 'stripe'} readOnly />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCheckoutTopUp}
              disabled={loadingAction === 'topup'}
              className="btn btn-primary btn-block"
              style={{ padding: '0.875rem', fontSize: '1rem' }}
            >
              {loadingAction === 'topup' ? (
                <>
                  <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Connecting to Stripe Secure Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Pay ${calculateTotal(amount)} via Stripe</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 5. BILLING & INVOICES TAB */}
        {activeTab === 'billing' && (
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="page-title">Billing & Subscriptions</h1>
                <p className="page-subtitle">Manage payment methods, invoices receipts, and tier entitlements.</p>
              </div>
              <button 
                onClick={handleOpenCustomerPortal}
                disabled={loadingAction === 'portal'}
                className="btn btn-secondary"
              >
                {loadingAction === 'portal' ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ExternalLink size={16} />
                )}
                <span>Stripe Customer Portal</span>
              </button>
            </div>

            <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>ACTIVE SUBSCRIPTION</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.375rem 0' }}>Pro Platform Plan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span className="badge badge-success">Active</span>
                  <span style={{ color: 'var(--text-muted)' }}>Renews next month ($49/mo)</span>
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>AVAILABLE PREPAID CREDITS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.375rem 0', color: '#10b981' }}>$124.50 USD</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Auto-deducted per API invocation</span>
                  <button 
                    onClick={() => setActiveTab('top-up')}
                    className="btn btn-sm btn-primary"
                    style={{ marginLeft: 'auto' }}
                  >
                    Add Credits
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '1rem' }}>
                <Clock size={18} />
                <span>Recent Invoices & Payment Receipts</span>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>INVOICE / ID</th>
                      <th>DATE</th>
                      <th>DESCRIPTION</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'right' }}>RECEIPT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>in_1Q89bXDy28</td>
                      <td>2026-08-01</td>
                      <td>Pro Plan Monthly Subscription</td>
                      <td>$49.00</td>
                      <td><span className="badge badge-success">Paid</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={handleOpenCustomerPortal} className="btn btn-sm btn-secondary">
                          <ExternalLink size={12} /> View PDF
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>ch_3P50aQDy28</td>
                      <td>2026-07-28</td>
                      <td>Prepaid Credit Top-Up ($100.00)</td>
                      <td>$106.00</td>
                      <td><span className="badge badge-success">Paid</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={handleOpenCustomerPortal} className="btn btn-sm btn-secondary">
                          <ExternalLink size={12} /> View PDF
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace' }}>in_1P12zLDy28</td>
                      <td>2026-07-01</td>
                      <td>Pro Plan Monthly Subscription</td>
                      <td>$49.00</td>
                      <td><span className="badge badge-success">Paid</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={handleOpenCustomerPortal} className="btn btn-sm btn-secondary">
                          <ExternalLink size={12} /> View PDF
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. DEVELOPER DOCS TAB */}
        {activeTab === 'docs' && (
          <div className="page-container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>Documentation</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>API Quickstart</span>
            </div>

            <h1 className="page-title">Developer Quickstart</h1>
            <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
              The Keepseed API follows modern OpenAI & Anthropic standards. Easily swap endpoints in existing SDK libraries with drop-in compatibility.
            </p>

            {/* Endpoints Table */}
            <div className="table-wrapper" style={{ marginBottom: '2rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PARAMETER</th>
                    <th>CONFIGURATION VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Base URL (OpenAI Spec)</td>
                    <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>https://api.keepseed.io/v1</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Base URL (Anthropic Spec)</td>
                    <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>https://api.keepseed.io/anthropic</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Available Models</td>
                    <td style={{ fontFamily: 'monospace' }}>keepseed-v4-instant, keepseed-v4-pro, keepseed-v4-vision</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Authentication</td>
                    <td style={{ fontFamily: 'monospace' }}>Bearer ${'{KEEPSEED_API_KEY}'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SDK Code Snippets */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Integration Code Example</h2>
            </div>

            <div className="code-box-container">
              <div className="code-box-header">
                <div className="code-lang-selector">
                  {(['curl', 'python', 'nodejs', 'go'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeTab(lang)}
                      className={`code-lang-tab ${codeTab === lang ? 'active' : ''}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => handleCopyCode(getCodeSnippet())}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="code-pre-content">{getCodeSnippet()}</pre>
            </div>

            {/* Interactive API Tester */}
            <div className="card" style={{ marginTop: '2rem' }}>
              <div className="card-title">
                <Play size={18} />
                <span>Interactive Live API Explorer</span>
              </div>
              <p className="card-description" style={{ marginBottom: '1rem' }}>
                Test backend endpoints directly from your browser console to verify server responses.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  value={apiTesterEndpoint}
                  onChange={(e) => setApiTesterEndpoint(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                <button 
                  onClick={handleRunApiTest}
                  disabled={loadingAction === 'test_api'}
                  className="btn btn-primary"
                >
                  {loadingAction === 'test_api' ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                  <span>Execute Request</span>
                </button>
              </div>

              {apiTesterResponse && (
                <pre style={{ padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8125rem', overflowX: 'auto', color: '#a7f3d0' }}>
                  {apiTesterResponse}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 7. PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="page-container">
            <div className="page-header" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              <h1 className="page-title">Predictable, Transparent Pricing</h1>
              <p className="page-subtitle">Choose the subscription tier tailored for your workload with instant Stripe provisioning.</p>

              {/* Monthly / Yearly Toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '9999px', border: '1px solid var(--border-color)', marginTop: '1.25rem' }}>
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '9999px', border: 'none' }}
                >
                  Monthly Billing
                </button>
                <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '9999px', border: 'none' }}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            <div className="pricing-grid">
              {/* Starter Plan */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Starter Plan</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>For indie developers & prototypes.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '19' : '15'}
                  <span className="plan-price-period">/ month</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 2,000,000 monthly tokens</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Keepseed Instant model access</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 1,000 Requests/min rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Standard community support</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('starter')}
                  disabled={loadingAction === 'sub_starter'}
                  className="btn btn-secondary btn-block"
                >
                  {loadingAction === 'sub_starter' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe Starter'}
                </button>
              </div>

              {/* Pro Plan (Featured) */}
              <div className="pricing-card featured">
                <div className="featured-pill">RECOMMENDED</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pro Platform</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>For scaling AI production products.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '49' : '39'}
                  <span className="plan-price-period">/ month</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 10,000,000 monthly tokens</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Instant, Expert & Vision models</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> DeepThink reasoning effort</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 10,000 Requests/min rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Priority email & chat support</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('pro')}
                  disabled={loadingAction === 'sub_pro'}
                  className="btn btn-primary btn-block"
                >
                  {loadingAction === 'sub_pro' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe Pro'}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>For high volume & bespoke SLA.</p>

                <div className="plan-price">
                  Custom
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Unlimited customized quota</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Dedicated cluster instance</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 99.99% uptime SLA guarantee</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Dedicated Slack engineer channel</li>
                </ul>

                <button 
                  onClick={() => setActiveTab('help')}
                  className="btn btn-secondary btn-block"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. HELP & FAQ TAB */}
        {activeTab === 'help' && (
          <div className="page-container" style={{ maxWidth: '800px' }}>
            <div className="page-header">
              <h1 className="page-title">Help & Frequently Asked Questions</h1>
              <p className="page-subtitle">Find answers regarding billing, Stripe checkouts, API keys, and model parameters.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                {
                  q: 'How are prepaid credits deducted vs monthly subscriptions?',
                  a: 'Monthly subscriptions provide an allocated bundle of tokens reset on every billing cycle. Prepaid top-up credits are drawn down only when you exceed your plan quota or consume pay-as-you-go API services.'
                },
                {
                  q: 'How do I download tax invoice receipts for accounting?',
                  a: 'Navigate to the Billing section and click "Stripe Customer Portal". You can download official PDF receipts with your company tax ID, update billing address, or modify payment methods.'
                },
                {
                  q: 'Is Keepseed compatible with the official OpenAI and Anthropic Python/TypeScript SDKs?',
                  a: 'Yes. Simply configure base_url to https://api.keepseed.io/v1 and pass your Keepseed API key. No special wrappers or dependencies are needed.'
                },
                {
                  q: 'What payment methods are supported via Stripe checkout?',
                  a: 'We support Visa, Mastercard, American Express, Google Pay, Apple Pay, Link, and regional bank methods via Stripe Checkout.'
                }
              ].map((faq, i) => (
                <div 
                  key={i} 
                  className="card"
                  style={{ cursor: 'pointer', padding: '1.25rem' }}
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{faq.q}</span>
                    {expandedFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  {expandedFaq === i && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-secondary)', textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Need Further Assistance?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Our developer support engineering team is available 24/7.
              </p>
              <button 
                onClick={() => setNotification({ type: 'success', message: 'Support ticket initiated! A representative will respond to user@example.com shortly.' })}
                className="btn btn-primary"
              >
                Open Support Ticket
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
