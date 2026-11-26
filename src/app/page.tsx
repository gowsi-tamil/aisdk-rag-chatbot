'use client';

import { useRef, useState, useEffect } from 'react';
import { useClerk, useAuth } from '@clerk/nextjs';
import { useChat } from '@ai-sdk/react';
import {
  FileText,
  Upload,
  Send,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bot,
  User,
  X,
} from 'lucide-react';

import { processPdfFile } from './upload/actions';
import { Response } from '@/components/ai-elements/response';

export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat();

  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const signInOpened = useRef(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !signInOpened.current) {
      signInOpened.current = true;
      openSignIn({});
    }
  }, [isLoaded, isSignedIn, openSignIn]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadedFile, setUploadedFile] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChatBusy = status === 'submitted' || status === 'streaming';

  // Upload PDF and automatically request a summary.
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadError('');
    setUploadStatus('');
    setUploadedFile('');

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setUploadError('Please select a valid PDF file.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading and processing your PDF...');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const result = await processPdfFile(formData);

      if (!result.success) {
        throw new Error(result.error || 'PDF upload failed.');
      }

      setUploadedFile(file.name);
      setUploadStatus(result.message || '');

      // Automatically ask AI to summarize the uploaded document.
      await sendMessage({
        text: `I have uploaded a PDF document named "${file.name}". Please summarize this document using the knowledge base. Include its main topics, important points, key information, and conclusions. If information is not available in the uploaded document, clearly mention that.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while uploading the PDF.',
      );
      setUploadStatus('');
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send chat message.
  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isChatBusy || isUploading) return;

    setInput('');

    await sendMessage({
      text: message,
    });
  };

  // Start a new chat.
  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setUploadError('');
    setUploadStatus('');
    setUploadedFile('');
  };

  const suggestedPrompts = [
    'Summarize the uploaded document',
    'What are the important points?',
    'Explain this document in simple words',
    'What are the key conclusions?',
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles size={20} />
          </div>

          <div>
            <h1 className="font-bold">Knowledge AI</h1>
            <p className="text-xs text-slate-500">RAG Workspace</p>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-4">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Chat
          </button>

          <div>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3 text-sm font-medium text-blue-700">
              <MessageSquare size={18} />
              AI Chat
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileText size={17} />
              Knowledge Base
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Upload PDF documents and ask questions about their contents.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <Upload size={15} />
              Upload PDF
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Bot size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-xs text-green-600">Gemini Powered</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div>
            <h2 className="font-semibold">AI Document Assistant</h2>
            <p className="text-xs text-slate-500">
              Upload documents and chat with your data
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Gemini Connected
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:px-4"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Upload PDF</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </header>

        {/* Hidden PDF Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Chat Area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Empty State */}
              {messages.length === 0 && !isUploading && (
                <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Sparkles size={32} />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Chat with your documents
                  </h2>

                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                    Upload a PDF document and let AI understand, summarize, and
                    answer questions using its content.
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-7 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    <Upload size={18} />
                    Upload your PDF
                  </button>

                  <p className="mt-3 text-xs text-slate-400">
                    PDF documents only
                  </p>

                  <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          if (uploadedFile) {
                            setInput(prompt);
                          } else {
                            fileInputRef.current?.click();
                          }
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Sparkles size={16} className="mb-2 text-blue-500" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={22} />

                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Processing your PDF
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        Extracting text, generating embeddings and saving to
                        Neon...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Success */}
              {uploadedFile && uploadStatus && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 text-green-600" />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-green-800">
                        PDF uploaded successfully
                      </p>

                      <p className="mt-1 break-all text-xs text-green-700">
                        {uploadedFile}
                      </p>

                      <p className="mt-1 text-xs text-green-700">
                        {uploadStatus}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUploadedFile('');
                        setUploadStatus('');
                      }}
                      className="text-green-700"
                      aria-label="Dismiss upload message"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle size={20} className="mt-0.5 text-red-600" />

                  <p className="flex-1 text-sm text-red-700">{uploadError}</p>

                  <button
                    onClick={() => setUploadError('')}
                    className="text-red-600"
                    aria-label="Dismiss error"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User size={18} />
                    ) : (
                      <Bot size={19} />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {message.parts.map((part, index) =>
                      part.type === 'text' ? (
                        message.role === 'assistant' ? (
                          <Response key={index}>{part.text}</Response>
                        ) : (
                          <p key={index} className="whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      ) : null,
                    )}
                  </div>
                </div>
              ))}

              {/* AI Loading */}
              {isChatBusy && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Bot size={19} />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    Gemini is thinking...
                  </div>
                </div>
              )}

              {/* Scroll spacing */}
              <div className="h-2" />
            </div>
          </div>

          {/* Chat Input */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 md:px-8">
            <div className="mx-auto max-w-4xl">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:border-blue-400"
              >
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={
                    uploadedFile
                      ? 'Ask anything about your uploaded PDF...'
                      : 'Upload a PDF or ask a question...'
                  }
                  rows={1}
                  className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  onClick={() => {
                    if (!isSignedIn) {
                      openSignIn({});
                    }
                  }}
                  disabled={!input.trim() || isChatBusy || isUploading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isChatBusy ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </form>

              <p className="mt-3 text-center text-xs text-slate-400">
                AI can make mistakes. Verify important information from your
                documents.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
