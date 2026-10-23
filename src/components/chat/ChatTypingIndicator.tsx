export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Bestie 正在輸入">
      <div className="bubble-incoming flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot chat-typing-dot-delay-1" />
        <span className="chat-typing-dot chat-typing-dot-delay-2" />
      </div>
    </div>
  );
}
