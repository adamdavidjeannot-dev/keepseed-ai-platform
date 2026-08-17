import { useState } from 'react';
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
  Info,
  ChevronRight,
  Plus,
  Send,
  Paperclip,
  Globe,
  Zap,
  Eye,
  Award,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CNY'>('USD');
  const [amount, setAmount] = useState<number>(2);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'antom' | 'gpay'>('paypal');
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'nodejs'>('curl');
  const [copied, setCopied] = useState(false);

  // Chat UI States
  const [modelType, setModelType] = useState<'instant' | 'expert' | 'vision'>('instant');
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [inputPrompt, setInputPrompt] = useState('');

  const calculateTotal = (amt: number) => {
    const vat = amt * 0.06;
    return (amt + vat).toFixed(2);
  };

  const handleSendMessage = () => {
    if (!inputPrompt.trim()) return;
    const userMsg = inputPrompt;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInputPrompt('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          text: `NexusAI (${modelType.toUpperCase()} mode): Response generated for "${userMsg}". DeepThink: ${deepThinkEnabled ? 'Enabled' : 'Disabled'}, Web Search: ${searchEnabled ? 'Enabled' : 'Disabled'}.` 
        }
      ]);
    }, 500);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckoutTopUp = async () => {
    try {
      const res = await fetch('/api/create-topup-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customerEmail: 'user@example.com' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe Top-Up Checkout endpoint ready. Set STRIPE_SECRET_KEY in server/.env to enable live redirection.');
      }
    } catch (err) {
      alert('Stripe Top-Up Checkout endpoint ready at /api/create-topup-checkout');
    }
  };

  const handleCheckoutSubscription = async (priceId: string) => {
    try {
      const res = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, customerEmail: 'user@example.com' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Stripe Subscription Checkout initiated for ${priceId}. Set STRIPE_SECRET_KEY in server/.env.`);
      }
    } catch (err) {
      alert('Stripe Subscription Checkout endpoint ready at /api/create-subscription-checkout');
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'cus_demo_id' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe Customer Portal endpoint ready. Set STRIPE_SECRET_KEY in server/.env.');
      }
    } catch (err) {
      alert('Stripe Customer Portal endpoint ready at /api/create-portal-session');
    }
  };

  const getCodeSnippet = () => {
    if (codeTab === 'curl') {
      return `curl https://api.nexusai.example/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${NEXUS_API_KEY}" \\
  -d '{
        "model": "nexus-v4-pro",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": "Hello!"}
        ],
        "thinking": {"type": "enabled"},
        "reasoning_effort": "high",
        "stream": false
      }'`;
    }
    if (codeTab === 'python') {
      return `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get('NEXUS_API_KEY'),
    base_url="https://api.nexusai.example"
)

response = client.chat.completions.create(
    model="nexus-v4-pro",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

print(response.choices[0].message.content)`;
    }
    return `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.nexusai.example',
  apiKey: process.env.NEXUS_API_KEY,
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "nexus-v4-pro",
    thinking: { type: "enabled" },
    reasoning_effort: "high",
    stream: false,
  });

  console.log(completion.choices[0].message.content);
}

main();`;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Bot size={28} />
          <span>NexusAI</span>
        </div>

        <button 
          onClick={() => {
            setActiveTab('chat');
            setMessages([]);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background-color 0.2s ease'
          }}
        >
          <Plus size={18} />
          <span>New chat</span>
        </button>

        <ul className="nav-list">
          <li 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            <Activity size={20} />
            <span>Usage</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'api-keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-keys')}
          >
            <Key size={20} />
            <span>API keys</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'top-up' ? 'active' : ''}`}
            onClick={() => setActiveTab('top-up')}
          >
            <CreditCard size={20} />
            <span>Top up</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <LayoutDashboard size={20} />
            <span>Billing</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <BookOpen size={20} />
            <span>Docs</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <HelpCircle size={20} />
            <span>Help & Feedback</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <Tag size={20} />
            <span>Pricing</span>
          </li>
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={24} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Demo User</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>user@example.com</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ padding: activeTab === 'chat' ? '0' : '2rem' }}>
        {activeTab === 'chat' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Controls / Model Selection */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '2rem', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setModelType('instant')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '1.5rem',
                    border: 'none',
                    background: modelType === 'instant' ? 'var(--accent-color)' : 'transparent',
                    color: modelType === 'instant' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Zap size={16} /> Instant
                </button>
                <button
                  onClick={() => setModelType('expert')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '1.5rem',
                    border: 'none',
                    background: modelType === 'expert' ? 'var(--accent-color)' : 'transparent',
                    color: modelType === 'expert' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Award size={16} /> Expert
                </button>
                <button
                  onClick={() => setModelType('vision')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '1.5rem',
                    border: 'none',
                    background: modelType === 'vision' ? 'var(--accent-color)' : 'transparent',
                    color: modelType === 'vision' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Eye size={16} /> Vision
                </button>
              </div>
            </div>

            {/* Chat Conversation History Area */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Bot size={48} style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
                  <h2>Into the Unknown</h2>
                  <p style={{ marginTop: '0.5rem' }}>Start a conversation or choose a model mode to begin prompting.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      padding: '0.875rem 1.25rem',
                      borderRadius: '1rem',
                      background: msg.role === 'user' ? 'var(--accent-color)' : 'var(--bg-secondary)',
                      color: '#fff',
                      lineHeight: 1.5,
                      border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            {/* Input Bar Section */}
            <div style={{ padding: '1rem 2rem 2rem', background: 'var(--bg-primary)' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '0.75rem' }}>
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message NexusAI..."
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '1rem',
                        border: `1px solid ${deepThinkEnabled ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: deepThinkEnabled ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: deepThinkEnabled ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      DeepThink
                    </button>
                    <button 
                      onClick={() => setSearchEnabled(!searchEnabled)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '1rem',
                        border: `1px solid ${searchEnabled ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        background: searchEnabled ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: searchEnabled ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Globe size={12} /> Search
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <Paperclip size={18} />
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      style={{ background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '0.375rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'docs' ? (
          <div style={{ maxWidth: '850px' }}>
            {/* Breadcrumb Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              <span>Quick Start</span>
              <ChevronRight size={16} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Your First API Call</span>
            </div>

            <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>Your First API Call</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              The NexusAI API uses an API format compatible with standard OpenAI/Anthropic SDKs. By modifying the configuration, you can use existing SDKs or software tools to connect seamlessly.
            </p>

            {/* API Parameters Table */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '30%' }}>PARAM</th>
                    <th style={{ padding: '0.75rem 1rem' }}>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>base_url (OpenAI)</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>https://api.nexusai.example</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>base_url (Anthropic)</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>https://api.nexusai.example/anthropic</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>api_key</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Generate an API key in your platform dashboard</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>model</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                      nexus-v4-flash<br />nexus-v4-pro
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Integration Section */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>Integrate with Agent Tools</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              NexusAI API is supported by developer tools and AI agent integrations. You can use Nexus models as backend providers directly across standard agents.
            </p>

            {/* Code Examples Section */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>Invoke The Chat API</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Once you have created an API key, you can access the chat completion endpoint using the examples below:
            </p>

            {/* Language Selector & Code Box */}
            <div style={{ background: '#0d1117', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 1rem', background: '#161b22' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['curl', 'python', 'nodejs'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeTab(lang)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        background: codeTab === lang ? 'var(--accent-color)' : 'transparent',
                        color: codeTab === lang ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleCopyCode(getCodeSnippet())}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ padding: '1rem', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.5, color: '#e6edf3' }}>
                <pre>{getCodeSnippet()}</pre>
              </div>
            </div>
          </div>
        ) : activeTab === 'top-up' ? (
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Top up</h1>
            
            {/* Currency Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
              <button 
                onClick={() => setSelectedCurrency('USD')}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', background: selectedCurrency === 'USD' ? 'var(--accent-color)' : 'transparent', color: '#fff', cursor: 'pointer' }}
              >
                USD
              </button>
              <button 
                onClick={() => setSelectedCurrency('CNY')}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', background: selectedCurrency === 'CNY' ? 'var(--accent-color)' : 'transparent', color: '#fff', cursor: 'pointer' }}
              >
                CNY
              </button>
            </div>

            {/* Amount Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Amount</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[2, 5, 10, 20, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border-color)',
                      background: amount === val ? 'var(--accent-color)' : 'var(--bg-secondary)',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Display */}
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>${calculateTotal(amount)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Info size={14} /> Total excluding tax ${amount.toFixed(2)} + VAT(6%) ${(amount * 0.06).toFixed(2)}
              </div>
            </div>

            {/* Platform Announcement Notice */}
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', color: '#eab308', fontSize: '0.875rem' }}>
              The official version of Nexus-V1-Pro model service has been updated with off-peak rates. Please review the pricing documentation for full details.
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Payment method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div 
                  onClick={() => setPaymentMethod('paypal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${paymentMethod === 'paypal' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <span>Stripe Checkout (Dynamic Payment Methods)</span>
                  <input type="radio" checked={paymentMethod === 'paypal'} readOnly />
                </div>
                <div 
                  onClick={() => setPaymentMethod('antom')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${paymentMethod === 'antom' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <span>Credit Card / Visa / Mastercard</span>
                  <input type="radio" checked={paymentMethod === 'antom'} readOnly />
                </div>
                <div 
                  onClick={() => setPaymentMethod('gpay')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${paymentMethod === 'gpay' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <span>Google Pay / Apple Pay</span>
                  <input type="radio" checked={paymentMethod === 'gpay'} readOnly />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCheckoutTopUp} 
              className="btn" 
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <span>Pay ${calculateTotal(amount)} with {paymentMethod === 'gpay' ? 'Google Pay' : paymentMethod === 'paypal' ? 'Stripe Checkout' : 'Card'}</span>
            </button>

            {/* Information Footer */}
            <div style={{ marginTop: '2rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Note</p>
              <p>1. The recharge amount is solely for API service usage. Web and mobile chat interactions do not require API recharge.</p>
              <p>2. Processing may take between 24-72 hours if funds are not credited immediately.</p>
            </div>
          </div>
        ) : activeTab === 'usage' ? (
          <div className="card-grid">
            <div className="card">
              <h3>Tokens Used</h3>
              <p>Total token consumption this month.</p>
              <h2 style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>4,821,900</h2>
            </div>
            <div className="card">
              <h3>Active Keys</h3>
              <p>Keys authorized for current projects.</p>
              <h2 style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>3 Active Keys</h2>
            </div>
            <div className="card">
              <h3>RPM Limit</h3>
              <p>Requests allowed per minute.</p>
              <h2 style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>10,000 RPM</h2>
            </div>
          </div>
        ) : activeTab === 'api-keys' ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>API Secret Keys</h3>
              <button className="btn">Create New Key</button>
            </div>
            <p>Manage access keys used for authenticating API requests.</p>
          </div>
        ) : activeTab === 'billing' ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>Billing & Subscription Portal</h3>
                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Manage your plans, invoice receipts, and automatic tax settings.</p>
              </div>
              <button onClick={handleOpenCustomerPortal} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Stripe Portal</span>
                <ExternalLink size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Subscription</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.25rem' }}>Pro Plan ($49/mo)</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Prepaid Credit Balance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.25rem', color: '#10b981' }}>$124.50</div>
              </div>
            </div>
          </div>
        ) : activeTab === 'help' ? (
          <div className="card">
            <h3>Help & Support Center</h3>
            <p>Frequently asked questions, community links, and support contact options.</p>
          </div>
        ) : activeTab === 'pricing' ? (
          <div className="card-grid">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3>Starter Plan</h3>
                <p>For individuals and small chat workloads.</p>
                <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>$19 <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>/ month</span></h2>
              </div>
              <button onClick={() => handleCheckoutSubscription('price_1U5VUcDy28wjEXYsN7AwEJMb')} className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>
                Subscribe Starter
              </button>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--accent-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-color)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>RECOMMENDED</span>
                <h3 style={{ marginTop: '0.5rem' }}>Pro Plan</h3>
                <p>For high-throughput API & advanced model access.</p>
                <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>$49 <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>/ month</span></h2>
              </div>
              <button onClick={() => handleCheckoutSubscription('price_1U5VUcDy28wjEXYsMwd5Ltxo')} className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>
                Subscribe Pro
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>{activeTab.toUpperCase()} Section</h3>
            <p>Content area for {activeTab} view.</p>
          </div>
        )}
      </main>
    </div>
  );
}
