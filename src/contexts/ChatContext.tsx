import { createContext, ReactNode, useContext, useState } from "react";

const CHAT_ACCORDION_VALUE = "item-1";

const ChatContext = createContext({
  isVisible: true,
  toggleChatbot: () => {},
  openValue: "",
  setOpenValue: (_value: string) => {},
  openChat: () => {},
});

export const useChatbot = () => useContext(ChatContext);

interface Props {
  children: ReactNode;
}

export function ChatProvider({ children }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [openValue, setOpenValue] = useState("");

  const toggleChatbot = () => {
    setIsVisible(!isVisible);
  };

  const openChat = () => {
    setIsVisible(true);
    setOpenValue(CHAT_ACCORDION_VALUE);
  };

  return (
    <ChatContext.Provider
      value={{ isVisible, toggleChatbot, openValue, setOpenValue, openChat }}
    >
      {children}
    </ChatContext.Provider>
  );
}
