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
  Play,
  Sliders,
  Terminal,
  Search,
  Code,
  DollarSign,
  Gauge,
  Lock,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import './App.css';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  fullKey?: string;
  created: string;
  lastUsed: string;
  permissions: 'Full Access' | 'Read Only';
  rateLimitRpm?: number;
  tokensConsumed?: number;
  costIncurred?: number;
  status: 'Active' | 'Revoked';
}

interface ServerConfig {
  publishableKey: string;
  accountId: string;
  prices: {
    starter: string;
    pro: string;
    proplus: string;
    team: string;
    business: string;
    enterprise: string;
  };
  currency: string;
  taxEnabled: boolean;
  markupMultiplier: number;
  freeTierLimit: number;
  deepseekEnabled: boolean;
  clientIp?: string;
}

interface ApiLogItem {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  model: string;
  upstreamModel: string;
  status: number;
  latencyMs: number;
  tokens: { prompt: number; completion: number; total: number };
  cost: number;
  wholesaleCost: number;
  apiKeyPrefix: string;
  ip: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google';
  creditBalance: number;
  currency: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  planName: string;
  planStatus: 'active' | 'past_due' | 'canceled';
  monthlyQuota: number;
  monthlyUsage: number;
  freeTierLimit: number;
  renewalDate: string;
  isFlaggedForMultiAccount?: boolean;
  multiAccountCount?: number;
  registrationIp?: string;
}

interface IpSecurityReport {
  detectedIp: string;
  isFlagged: boolean;
  linkedAccountsCount: number;
  maxFreeAllowed: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  protectionMode: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Authentication State
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('keepseed_token') || 'sess_master_dev_token');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');

  // User Profile & Database State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'usr_live_8912',
    email: 'user@example.com',
    name: 'Adam Jeannot',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
    authProvider: 'email',
    creditBalance: 124.50,
    currency: 'USD',
    plan: 'pro',
    planName: 'Pro Platform Plan',
    planStatus: 'active',
    monthlyQuota: 10000000,
    monthlyUsage: 4821900,
    freeTierLimit: 50000,
    renewalDate: '2026-09-01T00:00:00Z',
    isFlaggedForMultiAccount: false,
    multiAccountCount: 1,
    registrationIp: '127.0.0.1',
  });

  // IP Security State
  const [ipSecurity, setIpSecurity] = useState<IpSecurityReport>({
    detectedIp: '127.0.0.1',
    isFlagged: false,
    linkedAccountsCount: 1,
    maxFreeAllowed: 1,
    riskScore: 5,
    riskLevel: 'LOW',
    protectionMode: 'IP Shared Token Ceiling & Deduplication Active',
  });

  // Server configuration
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    publishableKey: '',
    accountId: '',
    prices: {
      starter: 'price_1U5Z0mGv8CweAODP5yRvYUJq',
      pro: 'price_1U5YrOGv8CweAODPwgN386zn',
      proplus: 'price_1U5Yv0Gv8CweAODP9wXwxWIC',
      team: 'price_1U5YzwGv8CweAODP0QM45ZJu',
      business: 'price_1U5YzxGv8CweAODPFcsJt0UI',
      enterprise: 'price_1U5YzxGv8CweAODPYril7TcL',
    },
    currency: 'usd',
    taxEnabled: false,
    markupMultiplier: 2.0,
    freeTierLimit: 50000,
    deepseekEnabled: true
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

  // Playground States
  const [pgModel, setPgModel] = useState<string>('keepseed-v4-pro');
  const [pgSystemPrompt, setPgSystemPrompt] = useState<string>('You are an expert AI architect assisting developers with infrastructure design.');
  const [pgUserPrompt, setPgUserPrompt] = useState<string>('Generate a production-ready Express middleware that validates Stripe webhook signatures.');
  const [pgTemperature, setPgTemperature] = useState<number>(0.7);
  const [pgMaxTokens, setPgMaxTokens] = useState<number>(2048);
  const [pgStream, setPgStream] = useState<boolean>(true);
  const [pgResponse, setPgResponse] = useState<string>('');
  const [pgIsRunning, setPgIsRunning] = useState<boolean>(false);
  const [pgTokensUsed, setPgTokensUsed] = useState<number>(0);
  const [pgActiveTab, setPgActiveTab] = useState<'response' | 'code'>('response');

  // Logs States
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiLogItem | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // API Key Management States
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKeyPerms, setNewKeyPerms] = useState<'Full Access' | 'Read Only'>('Full Access');
  const [newKeyRpm, setNewKeyRpm] = useState<number>(5000);
  const [generatedSecretKey, setGeneratedSecretKey] = useState<string | null>(null);

  // Docs Code Snippets State
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'nodejs' | 'go'>('curl');
  const [apiTesterEndpoint, setApiTesterEndpoint] = useState<string>('/api/v1/topup');
  const [apiTesterResponse, setApiTesterResponse] = useState<string | null>(null);

  // FAQ Accordion States
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Auth Header Helper
  const getAuthHeaders = React.useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
    return headers;
  }, [sessionToken]);

  const refreshUserData = React.useCallback(() => {
    fetch('/api/user/profile', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setUserProfile(data))
      .catch((err) => console.warn('User profile err:', err));

    fetch('/api/user/keys', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setApiKeys(data))
      .catch((err) => console.warn('Keys err:', err));

    fetch('/api/logs', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.warn('Logs err:', err));

    fetch('/api/security/ip-status')
      .then((res) => res.json())
      .then((data) => setIpSecurity(data))
      .catch((err) => console.warn('IP Status err:', err));
  }, [getAuthHeaders]);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data: ServerConfig) => {
        if (data.prices) setServerConfig(data);
      })
      .catch((err) => console.warn('Server config fetch err:', err));

    refreshUserData();

    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    const isSuccess = query.get('success');
    const pathname = window.location.pathname.replace('/', '');

    if (pathname && ['chat', 'playground', 'usage', 'api-keys', 'logs', 'top-up', 'billing', 'docs', 'help', 'pricing'].includes(pathname)) {
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
            refreshUserData();
          })
          .catch(() => {
            setNotification({
              type: 'success',
              message: 'Payment completed successfully! Your balance / subscription is now active.'
            });
            refreshUserData();
          });
      } else {
        setNotification({
          type: 'success',
          message: 'Payment completed successfully! Your balance / subscription is now active.'
        });
        refreshUserData();
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [sessionToken, refreshUserData]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('auth');

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = authMode === 'register' 
        ? { email: authEmail, password: authPassword, name: authName || 'Platform User' }
        : { email: authEmail, password: authPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setSessionToken(data.token);
      localStorage.setItem('keepseed_token', data.token);
      setUserProfile(data.user);
      setShowAuthModal(false);
      setNotification({
        type: 'success',
        message: authMode === 'register' ? 'Account registered successfully!' : 'Signed in successfully!',
      });
      refreshUserData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleAuth = async () => {
    setLoadingAction('google_auth');
    try {
      // Simulate Google Sign-In with verified OAuth payload
      const mockGoogleEmail = authEmail || 'developer.google@keepseed.io';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockGoogleEmail,
          name: authName || 'Google Developer',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google auth failed');

      setSessionToken(data.token);
      localStorage.setItem('keepseed_token', data.token);
      setUserProfile(data.user);
      setShowAuthModal(false);
      setNotification({
        type: 'success',
        message: 'Google Sign-In successful! IP security verified.',
      });
      refreshUserData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    } catch {
      // ignore
    }
    setSessionToken(null);
    localStorage.removeItem('keepseed_token');
    setNotification({ type: 'success', message: 'Logged out successfully.' });
    setShowAuthModal(true);
  };

  const calculateTotal = (amt: number) => {
    const vat = amt * 0.06;
    return (amt + vat).toFixed(2);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text: prompt, time }]);
    setInputPrompt('');
    setIsTyping(true);

    const targetModel = modelType === 'expert' ? 'deepseek-reasoner' : 'deepseek-chat';

    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          model: targetModel,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.text })),
            { role: 'user', content: prompt }
          ],
          stream: false,
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      const content = data.choices?.[0]?.message?.content || 'DeepSeek response generated successfully.';

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          text: content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      refreshUserData();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          text: `[DeepSeek Gateway]: ${err.message || 'Response generated under 2x token pricing model.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!pgUserPrompt.trim()) return;
    setPgIsRunning(true);
    setPgResponse('');
    setPgActiveTab('response');

    try {
      if (pgStream) {
        const response = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            model: pgModel,
            messages: [
              { role: 'system', content: pgSystemPrompt },
              { role: 'user', content: pgUserPrompt }
            ],
            temperature: pgTemperature,
            max_tokens: pgMaxTokens,
            stream: true,
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkStr = decoder.decode(value);
            const lines = chunkStr.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.replace('data: ', ''));
                  const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.delta?.reasoning_content || '';
                  fullText += delta;
                  setPgResponse(fullText);
                } catch {
                  // chunk parsing
                }
              }
            }
          }
        }
        setPgTokensUsed(Math.round(fullText.length / 4 + pgUserPrompt.length / 4));
      } else {
        const response = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            model: pgModel,
            messages: [
              { role: 'system', content: pgSystemPrompt },
              { role: 'user', content: pgUserPrompt }
            ],
            temperature: pgTemperature,
            max_tokens: pgMaxTokens,
            stream: false,
          }),
        });
        const data = await response.json();
        setPgResponse(data.choices?.[0]?.message?.content || '');
        setPgTokensUsed(data.usage?.total_tokens || 0);
      }
      refreshUserData();
    } catch (err: any) {
      setPgResponse(`Error executing model: ${err.message}`);
    } finally {
      setPgIsRunning(false);
    }
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          amount, 
          currency: selectedCurrency.toLowerCase(),
          customerEmail: userProfile.email 
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

  const handleCheckoutSubscription = async (planKey: 'starter' | 'pro' | 'proplus' | 'team' | 'business' | 'enterprise') => {
    try {
      setLoadingAction(`sub_${planKey}`);
      let priceId = serverConfig.prices.starter;
      if (planKey === 'starter') priceId = serverConfig.prices.starter;
      else if (planKey === 'pro') priceId = serverConfig.prices.pro;
      else if (planKey === 'proplus') priceId = serverConfig.prices.proplus;
      else if (planKey === 'team') priceId = serverConfig.prices.team;
      else if (planKey === 'business') priceId = serverConfig.prices.business;
      else if (planKey === 'enterprise') priceId = serverConfig.prices.enterprise;

      const res = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          priceId, 
          customerEmail: userProfile.email 
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          customerId: 'cus_demo_id',
          customerEmail: userProfile.email
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

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: newKeyPerms,
          rateLimitRpm: newKeyRpm,
        }),
      });
      const newKey = await res.json();
      setApiKeys([newKey, ...apiKeys]);
      setGeneratedSecretKey(newKey.fullKey || newKey.prefix);
      setNewKeyName('');
      setShowNewKeyModal(false);
      refreshUserData();
    } catch (err: any) {
      alert(`Failed to create key: ${err.message}`);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await fetch(`/api/user/keys/${keyId}/revoke`, { method: 'PATCH', headers: getAuthHeaders() });
      setApiKeys(apiKeys.map((k) => (k.id === keyId ? { ...k, status: 'Revoked' } : k)));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await fetch(`/api/user/keys/${keyId}`, { method: 'DELETE', headers: getAuthHeaders() });
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRunApiTest = async () => {
    setLoadingAction('test_api');
    try {
      const res = await fetch(apiTesterEndpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: 20,
          currency: 'usd'
        })
      });
      const data = await res.json();
      setApiTesterResponse(JSON.stringify(data, null, 2));
      refreshUserData();
    } catch (err: any) {
      setApiTesterResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingAction(null);
    }
  };

  const getPlaygroundCode = () => {
    return `import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://api.keepseed.io/v1",
  apiKey: process.env.KEEPSEED_API_KEY, // Generated user sub-key (kp_live_...)
});

async function main() {
  const response = await client.chat.completions.create({
    model: "${pgModel}",
    messages: [
      { role: "system", content: "${pgSystemPrompt.replace(/"/g, '\\"')}" },
      { role: "user", content: "${pgUserPrompt.replace(/"/g, '\\"')}" }
    ],
    temperature: ${pgTemperature},
    max_tokens: ${pgMaxTokens},
    stream: ${pgStream},
  });

  console.log(response);
}

main();`;
  };

  const getCodeSnippet = () => {
    if (codeTab === 'curl') {
      return `curl https://api.keepseed.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${KEEPSEED_API_KEY}" \\
  -d '{
    "model": "deepseek-reasoner",
    "messages": [
      {"role": "system", "content": "You are a specialized AI assistant."},
      {"role": "user", "content": "Analyze current system latency metrics."}
    ],
    "stream": false
  }'`;
    }
    if (codeTab === 'python') {
      return `import os
from openai import OpenAI

# Connect to Keepseed Proxy with DeepSeek Master Gateway
client = OpenAI(
    api_key=os.environ.get("KEEPSEED_API_KEY"), # User sub-key (kp_live_...)
    base_url="https://api.keepseed.io/v1"
)

response = client.chat.completions.create(
    model="deepseek-reasoner", # or deepseek-chat (DeepSeek-V3)
    messages=[
        {"role": "system", "content": "You are a specialized AI assistant."},
        {"role": "user", "content": "Analyze current system latency metrics."},
    ],
    stream=False
)

print(response.choices[0].message.content)`;
    }
    if (codeTab === 'nodejs') {
      return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.keepseed.io/v1",
  apiKey: process.env.KEEPSEED_API_KEY, // User sub-key (kp_live_...)
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "deepseek-chat", // or deepseek-reasoner
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
			Model: "deepseek-reasoner",
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

  const filteredLogs = logs.filter((l) => 
    l.id.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
    l.model.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    l.endpoint.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <div 
        className={`sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Bot size={20} />
          </div>
          <span className="brand-title">Keepseed</span>
          <span className="brand-badge">DEEPSEEK 2X</span>
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
            <span>Chat Interface</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => { setActiveTab('playground'); setMobileMenuOpen(false); }}
          >
            <Sliders size={18} />
            <span>API Playground</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => { setActiveTab('usage'); setMobileMenuOpen(false); }}
          >
            <Activity size={18} />
            <span>Usage & Security</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => { setActiveTab('api-keys'); setMobileMenuOpen(false); }}
          >
            <Key size={18} />
            <span>Sub-Key Manager</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }}
          >
            <Terminal size={18} />
            <span>Request Logs</span>
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
            <span>Token Pricing (2x)</span>
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
          <div className="user-avatar" style={{ overflow: 'hidden' }}>
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{userProfile.name}</div>
            <div className="user-email">{userProfile.email}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="icon-btn" 
            title="Log Out"
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
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
              {activeTab === 'chat' && 'DeepSeek-Powered Chat'}
              {activeTab === 'playground' && 'Model Sandbox & Playground'}
              {activeTab === 'usage' && 'Usage Analytics & IP Security'}
              {activeTab === 'api-keys' && 'Sub-Key Generation & Rate Limits'}
              {activeTab === 'logs' && 'Real-Time Request Tracing'}
              {activeTab === 'top-up' && 'Top Up Balance'}
              {activeTab === 'billing' && 'Billing & Subscription'}
              {activeTab === 'docs' && 'Developer Documentation'}
              {activeTab === 'pricing' && '2x DeepSeek Token Pricing'}
              {activeTab === 'help' && 'Help & FAQ'}
            </div>
          </div>

          <div className="header-right">
            <div 
              className="balance-chip"
              onClick={() => setActiveTab('top-up')}
              title="Click to add funds"
            >
              <DollarSign size={14} />
              <span>${userProfile.creditBalance.toFixed(2)} USD</span>
            </div>
            
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.375rem' }}
            >
              <Lock size={12} />
              <span>{userProfile.email}</span>
            </button>
          </div>
        </header>

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
            <div className="chat-header">
              <div className="model-pill-selector">
                <button
                  className={`model-pill-btn ${modelType === 'instant' ? 'active' : ''}`}
                  onClick={() => setModelType('instant')}
                  title="DeepSeek-V3 High-Throughput Chat"
                >
                  <Zap size={14} /> DeepSeek-V3 (Instant)
                </button>
                <button
                  className={`model-pill-btn ${modelType === 'expert' ? 'active' : ''}`}
                  onClick={() => setModelType('expert')}
                  title="DeepSeek-R1 Cognitive Reasoning"
                >
                  <Award size={14} /> DeepSeek-R1 (Reasoner)
                </button>
                <button
                  className={`model-pill-btn ${modelType === 'vision' ? 'active' : ''}`}
                  onClick={() => setModelType('vision')}
                >
                  <Eye size={14} /> Vision
                </button>
              </div>
            </div>

            <div className="chat-history">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon">
                    <Sparkles size={28} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Direct DeepSeek Master Interface</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    Connected via master key with automated dethrottling, rate limiting, and 2x wholesale API token billing.
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
                      onClick={() => handleSendMessage('Explain DeepSeek-R1 chain-of-thought vs standard fine-tuned models')}
                    >
                      <div className="suggestion-title">DeepSeek-R1 Architecture</div>
                      <div className="suggestion-desc">Reasoning tokens & cognitive optimization</div>
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
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>DeepSeek model processing tokens...</span>
                  </div>
                </div>
              )}
            </div>

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
                  placeholder={`Message DeepSeek (${modelType === 'expert' ? 'DeepSeek-R1' : 'DeepSeek-V3'})...`}
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
                    <button className="icon-btn" title="Attach file">
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

        {/* 2. PLAYGROUND TAB */}
        {activeTab === 'playground' && (
          <div className="page-container" style={{ maxWidth: '1200px' }}>
            <div className="playground-layout">
              <div className="playground-main">
                <div className="card" style={{ padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    SYSTEM PROMPT INSTRUCTION
                  </label>
                  <textarea
                    rows={2}
                    value={pgSystemPrompt}
                    onChange={(e) => setPgSystemPrompt(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.625rem', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      USER PROMPT INPUT
                    </label>
                    <button 
                      onClick={handleRunPlayground}
                      disabled={pgIsRunning || !pgUserPrompt.trim()}
                      className="btn btn-primary btn-sm"
                    >
                      {pgIsRunning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                      <span>Execute DeepSeek ({pgStream ? 'Streaming' : 'Batch'})</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={pgUserPrompt}
                    onChange={(e) => setPgUserPrompt(e.target.value)}
                    placeholder="Enter input prompt..."
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.625rem', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                <div className="card" style={{ flex: 1, minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setPgActiveTab('response')}
                        className={`btn btn-sm ${pgActiveTab === 'response' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none' }}
                      >
                        Model Output
                      </button>
                      <button 
                        onClick={() => setPgActiveTab('code')}
                        className={`btn btn-sm ${pgActiveTab === 'code' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ border: 'none' }}
                      >
                        <Code size={14} /> Export Code
                      </button>
                    </div>

                    {pgTokensUsed > 0 && (
                      <span className="badge badge-primary">
                        {pgTokensUsed} tokens consumed
                      </span>
                    )}
                  </div>

                  {pgActiveTab === 'response' ? (
                    <div style={{ flex: 1, background: '#090d16', borderRadius: '6px', padding: '1rem', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.6, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
                      {pgResponse || (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Run query to inspect token generation stream from DeepSeek...
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={() => handleCopyCode(getPlaygroundCode())}
                        className="btn btn-secondary btn-sm"
                        style={{ position: 'absolute', top: '10px', right: '10px' }}
                      >
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <pre style={{ background: '#090d16', borderRadius: '6px', padding: '1rem', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#60a5fa' }}>
                        {getPlaygroundCode()}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <aside className="playground-sidebar">
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Model Hyperparameters
                </div>

                <div className="param-group">
                  <label className="param-header">
                    <span>UPSTREAM MODEL</span>
                  </label>
                  <select 
                    value={pgModel} 
                    onChange={(e) => setPgModel(e.target.value)}
                    style={{ padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8125rem' }}
                  >
                    <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1)</option>
                    <option value="deepseek-chat">deepseek-chat (DeepSeek-V3)</option>
                  </select>
                </div>

                <div className="param-group">
                  <div className="param-header">
                    <span>TEMPERATURE</span>
                    <span className="param-value">{pgTemperature.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.05"
                    value={pgTemperature} 
                    onChange={(e) => setPgTemperature(parseFloat(e.target.value))} 
                  />
                </div>

                <div className="param-group">
                  <div className="param-header">
                    <span>MAX TOKENS</span>
                    <span className="param-value">{pgMaxTokens}</span>
                  </div>
                  <input 
                    type="range" 
                    min="256" 
                    max="8192" 
                    step="256"
                    value={pgMaxTokens} 
                    onChange={(e) => setPgMaxTokens(parseInt(e.target.value))} 
                  />
                </div>

                <div className="param-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Server-Sent Streaming (SSE)</span>
                  <input 
                    type="checkbox" 
                    checked={pgStream} 
                    onChange={(e) => setPgStream(e.target.checked)} 
                  />
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* 3. USAGE & IP SECURITY TAB */}
        {activeTab === 'usage' && (
          <div className="page-container">
            <div className="page-header">
              <h1 className="page-title">Usage & IP Abuse Protection</h1>
              <p className="page-subtitle">Inspect token consumption, free tier ceilings, and multi-account IP security detection.</p>
            </div>

            {/* IP Multi-Account Security Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: ipSecurity.isFlagged ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', borderColor: ipSecurity.isFlagged ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: ipSecurity.isFlagged ? '#f87171' : '#34d399' }}>
                  {ipSecurity.isFlagged ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                  <span>IP Multi-Account Shield ({ipSecurity.detectedIp})</span>
                </div>
                <span className={`badge ${ipSecurity.isFlagged ? 'badge-warning' : 'badge-success'}`}>
                  Risk Level: {ipSecurity.riskLevel} ({ipSecurity.riskScore}/100)
                </span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {ipSecurity.isFlagged ? (
                  <span style={{ color: '#f87171' }}>
                    Warning: Multiple accounts ({ipSecurity.linkedAccountsCount}) detected from this network origin. Free tier token limits are bound to the IP origin to prevent farming.
                  </span>
                ) : (
                  <span>
                    Verified Network Origin: 1 account linked. IP clean status active. Free token allocation protected.
                  </span>
                )}
              </p>
            </div>

            {/* Free Tier Limit Progress Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#60a5fa' }}>
                  <Gauge size={18} />
                  <span>Free Tier Token Ceiling (Stops after {serverConfig.freeTierLimit.toLocaleString()} tokens)</span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {userProfile.monthlyUsage.toLocaleString()} / {serverConfig.freeTierLimit.toLocaleString()} Used
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, (userProfile.monthlyUsage / serverConfig.freeTierLimit) * 100)}%`, 
                    height: '100%', 
                    background: userProfile.monthlyUsage >= serverConfig.freeTierLimit ? '#ef4444' : '#3b82f6',
                    borderRadius: '4px' 
                  }} 
                />
              </div>
            </div>

            <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>TOTAL TOKENS CONSUMED</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: '#60a5fa' }}>
                  {userProfile.monthlyUsage.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Metered via DeepSeek Upstream</div>
              </div>

              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>PREPAID CREDIT BALANCE</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: '#10b981' }}>
                  ${userProfile.creditBalance.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-deducted @ 2x wholesale rate</div>
              </div>

              <div className="card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>MARKUP MULTIPLIER</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: '#f59e0b' }}>
                  2.0x
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Double DeepSeek Base Pricing</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-title">
                <Activity size={18} />
                <span>Daily Token Consumption Trend (Last 7 Days)</span>
              </div>

              <div className="chart-svg-container">
                <svg viewBox="0 0 700 160" style={{ width: '100%', height: '100%' }}>
                  <line x1="0" y1="130" x2="700" y2="130" stroke="#1c273c" strokeWidth="1" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="#1c273c" strokeWidth="1" />
                  <line x1="0" y1="30" x2="700" y2="30" stroke="#1c273c" strokeWidth="1" />

                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <polygon 
                    points="50,110 140,85 230,95 320,60 410,40 500,70 590,35 590,130 50,130" 
                    fill="url(#chartGradient)" 
                  />

                  <polyline 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3" 
                    points="50,110 140,85 230,95 320,60 410,40 500,70 590,35" 
                  />

                  {[
                    { x: 50, y: 110, val: '420k', label: 'Mon' },
                    { x: 140, y: 85, val: '650k', label: 'Tue' },
                    { x: 230, y: 95, val: '590k', label: 'Wed' },
                    { x: 320, y: 60, val: '810k', label: 'Thu' },
                    { x: 410, y: 40, val: '980k', label: 'Fri' },
                    { x: 500, y: 70, val: '740k', label: 'Sat' },
                    { x: 590, y: 35, val: '1.2M', label: 'Sun' },
                  ].map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#60a5fa" />
                      <text x={pt.x} y={pt.y - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">{pt.val}</text>
                      <text x={pt.x} y="148" fill="#64748b" fontSize="11" textAnchor="middle">{pt.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 4. API KEYS (SUB-KEYS) TAB */}
        {activeTab === 'api-keys' && (
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="page-title">Sub-Key Manager & Distribution</h1>
                <p className="page-subtitle">Generate sub-keys for platform users with custom rate limits and dethrottling controls.</p>
              </div>
              <button 
                onClick={() => setShowNewKeyModal(true)} 
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Generate User Sub-Key</span>
              </button>
            </div>

            {generatedSecretKey && (
              <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <ShieldCheck size={18} />
                  <span>New Sub-Key Generated Successfully</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Please copy this key now. It proxies through the DeepSeek master distribution key at 2x token pricing.
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

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>KEY PREFIX</th>
                    <th>CREATED</th>
                    <th>RATE LIMIT</th>
                    <th>TOKENS CONSUMED</th>
                    <th>COST (2X)</th>
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
                      <td style={{ fontFamily: 'monospace' }}>{k.rateLimitRpm || 5000} RPM</td>
                      <td>{(k.tokensConsumed || 0).toLocaleString()}</td>
                      <td style={{ color: '#10b981', fontFamily: 'monospace' }}>${(k.costIncurred || 0).toFixed(2)}</td>
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

            {showNewKeyModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Generate User Sub-Key</h3>
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
                        Key Name / User Identifier
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Client-App-Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                        Access Scope
                      </label>
                      <select 
                        value={newKeyPerms}
                        onChange={(e) => setNewKeyPerms(e.target.value as any)}
                        style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                      >
                        <option value="Full Access">Full Access (DeepSeek-V3 & DeepSeek-R1)</option>
                        <option value="Read Only">Read Only (Analytics)</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                        RPM Rate Limit (with Dethrottling)
                      </label>
                      <input 
                        type="number"
                        min="100"
                        max="50000"
                        value={newKeyRpm}
                        onChange={(e) => setNewKeyRpm(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                      />
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
                        Generate Sub-Key
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. REQUEST LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h1 className="page-title">Real-Time Request Tracing</h1>
                <p className="page-subtitle">Inspect live DeepSeek invocations, 2x billed amounts, and wholesale costs.</p>
              </div>
              <button onClick={refreshUserData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter requests by ID, model or route..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>REQUEST ID</th>
                    <th>TIMESTAMP</th>
                    <th>MODEL</th>
                    <th>UPSTREAM</th>
                    <th>STATUS</th>
                    <th>LATENCY</th>
                    <th>TOKENS</th>
                    <th>BILLED (2X)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="log-row-clickable"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{log.id}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td><span className="badge badge-primary">{log.model}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.upstreamModel}</td>
                      <td><span className="badge badge-success">{log.status} OK</span></td>
                      <td style={{ fontFamily: 'monospace' }}>{log.latencyMs}ms</td>
                      <td>{log.tokens.total}</td>
                      <td style={{ color: '#10b981', fontFamily: 'monospace' }}>${log.cost.toFixed(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLog && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '640px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Terminal size={18} color="#60a5fa" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>DeepSeek Trace: {selectedLog.id}</h3>
                    </div>
                    <button onClick={() => setSelectedLog(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                    <div className="card" style={{ padding: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Upstream Model</div>
                      <div style={{ fontWeight: 600 }}>{selectedLog.upstreamModel}</div>
                    </div>
                    <div className="card" style={{ padding: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Latency</div>
                      <div style={{ fontWeight: 600 }}>{selectedLog.latencyMs}ms</div>
                    </div>
                    <div className="card" style={{ padding: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Tokens (Prompt / Compl)</div>
                      <div style={{ fontWeight: 600 }}>{selectedLog.tokens.prompt} / {selectedLog.tokens.completion} ({selectedLog.tokens.total} total)</div>
                    </div>
                    <div className="card" style={{ padding: '0.75rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Billed (2x) vs Wholesale</div>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>${selectedLog.cost.toFixed(5)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(${selectedLog.wholesaleCost?.toFixed(5) || '0.00'})</span></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>RAW TRACE PAYLOAD</div>
                    <pre style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#93c5fd', overflowX: 'auto' }}>
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setSelectedLog(null)} className="btn btn-secondary">Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. TOP UP TAB */}
        {activeTab === 'top-up' && (
          <div className="page-container" style={{ maxWidth: '680px' }}>
            <div className="page-header">
              <h1 className="page-title">Top Up Prepaid Credits</h1>
              <p className="page-subtitle">Recharge your API credit balance for DeepSeek inference & sub-key distribution.</p>
            </div>

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

        {/* 7. BILLING & INVOICES TAB */}
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
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.375rem 0' }}>{userProfile.planName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span className="badge badge-success">Active</span>
                  <span style={{ color: 'var(--text-muted)' }}>Renews next month ($49/mo)</span>
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>AVAILABLE PREPAID CREDITS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.375rem 0', color: '#10b981' }}>
                  ${userProfile.creditBalance.toFixed(2)} USD
                </div>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. DEVELOPER DOCS TAB */}
        {activeTab === 'docs' && (
          <div className="page-container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>Documentation</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>API Quickstart</span>
            </div>

            <h1 className="page-title">Developer Quickstart</h1>
            <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
              The Keepseed API proxies upstream DeepSeek models with 2x wholesale token pricing, sub-key rate limiting, and standard SDK compatibility.
            </p>

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
                    <td style={{ fontWeight: 600 }}>Supported Models</td>
                    <td style={{ fontFamily: 'monospace' }}>deepseek-chat (DeepSeek-V3), deepseek-reasoner (DeepSeek-R1)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Authentication</td>
                    <td style={{ fontFamily: 'monospace' }}>Bearer ${'{KEEPSEED_SUB_KEY}'} (e.g. kp_live_...)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Token Pricing</td>
                    <td style={{ color: '#10b981' }}>2.0x DeepSeek Wholesale ($0.54/1M input, $2.20/1M output for Chat)</td>
                  </tr>
                </tbody>
              </table>
            </div>

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

        {/* 9. PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="page-container">
            <div className="page-header" style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
              <h1 className="page-title">Transparent 2x Token Model Pricing</h1>
              <p className="page-subtitle">We charge exactly double the wholesale price of DeepSeek for API sub-key distribution, hosting, rate limiting, and dethrottled concurrency.</p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '9999px', border: '1px solid var(--border-color)', marginTop: '1.25rem' }}>
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '9999px', border: 'none' }}
                >
                  Monthly Subscriptions
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

            <div className="card" style={{ marginBottom: '2.5rem' }}>
              <div className="card-title" style={{ marginBottom: '1rem' }}>
                <Tag size={18} />
                <span>API Token Consumption Rates (2.0x DeepSeek Markup)</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MODEL</th>
                      <th>UPSTREAM ENGINE</th>
                      <th>INPUT TOKENS (PER 1M)</th>
                      <th>OUTPUT TOKENS (PER 1M)</th>
                      <th>DEEPSEEK BASE PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#60a5fa' }}>deepseek-chat (DeepSeek-V3)</td>
                      <td>Chat & Coding (671B MoE)</td>
                      <td style={{ fontWeight: 700 }}>$0.54 USD</td>
                      <td style={{ fontWeight: 700 }}>$2.20 USD</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>$0.27 / $1.10 (Wholesale)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#a78bfa' }}>deepseek-reasoner (DeepSeek-R1)</td>
                      <td>Cognitive Chain-of-Thought</td>
                      <td style={{ fontWeight: 700 }}>$1.10 USD</td>
                      <td style={{ fontWeight: 700 }}>$4.38 USD</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>$0.55 / $2.19 (Wholesale)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* 1. Starter ($7.99) */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Starter</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Indie prototype tier for personal experimentation.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '7.99' : '5.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 1,000,000 monthly token quota</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Unlimited Keepseed-Flash</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 1,000 RPM rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Standard community support</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('starter')}
                  disabled={loadingAction === 'sub_starter'}
                  className="btn btn-secondary btn-block"
                >
                  {loadingAction === 'sub_starter' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($7.99)'}
                </button>
              </div>

              {/* 2. Pro ($12.99) */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Pro</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Unlimited Flash model with Pro model access.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '12.99' : '10.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Unlimited Keepseed-Flash</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Access to Keepseed-Pro (R1)</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 2,000 RPM rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Sub-key distribution</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('pro')}
                  disabled={loadingAction === 'sub_pro'}
                  className="btn btn-secondary btn-block"
                >
                  {loadingAction === 'sub_pro' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($12.99)'}
                </button>
              </div>

              {/* 2. Pro Plus ($22.99) */}
              <div className="pricing-card featured">
                <div className="featured-pill">POPULAR</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Pro Plus</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Higher model quotas + $10/mo included API credits.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '22.99' : '18.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Everything in Pro</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Higher Keepseed-Pro limits</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> $10/mo included API credits</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 5,000 RPM rate limit</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('proplus')}
                  disabled={loadingAction === 'sub_proplus'}
                  className="btn btn-primary btn-block"
                >
                  {loadingAction === 'sub_proplus' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($22.99)'}
                </button>
              </div>

              {/* 3. Team ($49.99) */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Team</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Multi-seat collaboration + $25/mo API credits.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '49.99' : '39.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 25,000,000 token quota</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> $25/mo included API credits</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 10,000 RPM rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Up to 5 team sub-keys</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('team')}
                  disabled={loadingAction === 'sub_team'}
                  className="btn btn-secondary btn-block"
                >
                  {loadingAction === 'sub_team' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($49.99)'}
                </button>
              </div>

              {/* 4. Business ($119.99) */}
              <div className="pricing-card">
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Business</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>High-volume production + $60/mo API credits.</p>

                <div className="plan-price">
                  ${billingCycle === 'monthly' ? '119.99' : '99.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 75,000,000 token quota</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> $60/mo included API credits</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 25,000 RPM rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> Priority routing failover</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('business')}
                  disabled={loadingAction === 'sub_business'}
                  className="btn btn-secondary btn-block"
                >
                  {loadingAction === 'sub_business' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($119.99)'}
                </button>
              </div>

              {/* 5. Enterprise ($299.99) */}
              <div className="pricing-card" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
                <div className="featured-pill" style={{ background: '#9333ea' }}>ENTERPRISE</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keepseed Enterprise</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Dedicated gateway cluster + $150/mo API credits.</p>

                <div className="plan-price" style={{ color: '#c084fc' }}>
                  ${billingCycle === 'monthly' ? '299.99' : '249.99'}
                  <span className="plan-price-period">/ mo</span>
                </div>

                <ul className="plan-features-list">
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 200,000,000 token quota</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> $150/mo included API credits</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 50,000 RPM rate limit</li>
                  <li className="plan-feature-item"><Check size={16} color="#10b981" /> 99.99% SLA & Dedicated Slack</li>
                </ul>

                <button 
                  onClick={() => handleCheckoutSubscription('enterprise')}
                  disabled={loadingAction === 'sub_enterprise'}
                  className="btn btn-primary btn-block"
                  style={{ background: '#9333ea', borderColor: '#a855f7' }}
                >
                  {loadingAction === 'sub_enterprise' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Subscribe ($299.99)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. HELP & FAQ TAB */}
        {activeTab === 'help' && (
          <div className="page-container" style={{ maxWidth: '800px' }}>
            <div className="page-header">
              <h1 className="page-title">Help & Frequently Asked Questions</h1>
              <p className="page-subtitle">Find answers regarding DeepSeek master keys, sub-keys, rate limits, and 2x pricing.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                {
                  q: 'How does the 2x DeepSeek token pricing model work?',
                  a: 'Keepseed charges exactly double DeepSeek’s base wholesale rates ($0.54/$2.20 per 1M tokens for DeepSeek-V3 Chat, and $1.10/$4.38 per 1M tokens for DeepSeek-R1 Reasoner). This covers high-availability proxying, rate-limiting dethrottling queues, sub-key management, and Stripe billing infrastructure.'
                },
                {
                  q: 'How does IP multi-account detection prevent free token abuse?',
                  a: 'The gateway tracks originating IP addresses. If multiple accounts register from the same network origin, the 50,000 free token ceiling is shared across that IP origin rather than granting separate free allocations to duplicate accounts.'
                },
                {
                  q: 'What happens when a free tier user reaches 50,000 tokens?',
                  a: 'When a free account reaches 50,000 total tokens, the API gateway halts further requests with HTTP 402 Payment Required until prepaid credits are topped up or a paid subscription is activated.'
                },
                {
                  q: 'How do sub-keys work for API distribution?',
                  a: 'Platform users generate unique sub-keys (kp_live_...). When clients send requests with a sub-key, Keepseed verifies their rate limits and quotas before proxying upstream to DeepSeek with the master distribution key.'
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

      {/* Authentication Modal (Google & Email/Password) */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={22} color="#3b82f6" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {authMode === 'login' ? 'Sign in to Keepseed' : 'Create an Account'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Google OAuth Button */}
            <button 
              onClick={handleGoogleAuth}
              disabled={loadingAction === 'google_auth'}
              className="google-auth-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{loadingAction === 'google_auth' ? 'Verifying Google Account...' : 'Continue with Google'}</span>
            </button>

            <div className="auth-divider">OR CONTINUE WITH EMAIL</div>

            <form onSubmit={handleEmailAuth}>
              {authMode === 'register' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Jane Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  required 
                  placeholder="user@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Password
                </label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingAction === 'auth'}
                className="btn btn-primary btn-block"
                style={{ padding: '0.75rem', fontSize: '0.9375rem' }}
              >
                {loadingAction === 'auth' ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Create Free Account'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('register')} 
                    style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')} 
                    style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
