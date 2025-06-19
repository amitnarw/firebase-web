import { useEffect, useState } from "react";
import { realtime } from "../utils/firebase";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { onValue, push, ref, remove, update } from "firebase/database";
import type { User } from "firebase/auth";

interface UserInfo {
  email: string;
  name: string;
  "profile-image": string;
  username: string;
}

interface UserData {
  chats: {
    [key: string]: boolean;
  };
  info: UserInfo;
}

type Users = {
  [userId: string]: UserData;
};

type Chats = {
  [chatId: string]: boolean;
};

type Message = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
};

const Realtime = () => {
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [isAddingNewChatLoading, setIsAddingNewChatLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chats>({});
  const [allUsers, setAllUsers] = useState<Users | null>(null);
  const [selectedUser, setSelectedUser] = useState({
    name: "Select user",
    id: "",
  });
  const [selectedChat, setSelectedChat] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[] | null>(null);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    const res = localStorage.getItem("user");
    if (!res) {
      window.alert("User is not logged in");
      return;
    }
    setIsChatsLoading(true);
    const userData: User = JSON.parse(res);
    setUser(userData);
    const userChatRef = ref(realtime, `users/${userData?.uid}/chats`);
    const allUsersRef = ref(realtime, `users`);
    onValue(userChatRef, (snapshot) => {
      const userChats = snapshot.val();
      setChats(userChats);
      setIsChatsLoading(false);
    });
    onValue(allUsersRef, (snapshot) => {
      const all = snapshot.val();
      setAllUsers(all);
    });
  }, []);

  useEffect(() => {
    if (selectedChat) {
      selectChatMessages();
    }
  }, [selectedChat]);

  const selectChatMessages = () => {
    const messagesRef = ref(realtime, `messages/${selectedChat}`);
    onValue(messagesRef, (snapshot) => {
      const allMessages = snapshot.val();
      const sortedMessages = Object.entries(allMessages)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setChatMessages(sortedMessages);
    });
  };

  const handleSendMessage = () => {
    const messagesRef = ref(realtime, `messages/${selectedChat}`);
    push(messagesRef, {
      text: message,
      sender: user?.uid,
      timestamp: Date.now(),
    });

    setMessage("");
  };

  const handleEditMessage = () => {
    const messageRef = ref(realtime, `messages/${selectedChat}/${editMessage}`);
    update(messageRef, {
      text: message,
    });
    setMessage("");
  };

  const handleDeleteMessage = (messageId: string) => {
    const messageRef = ref(realtime, `messages/${selectedChat}/${messageId}`);
    remove(messageRef);
  };

  const handleAddNewChat = async () => {
    if (!selectedUser?.id || !newMessage) {
      window.alert(
        "Please select a user and write a message to create new chat"
      );
      return;
    }
    let chatDetails;
    if (user?.uid) {
      setIsAddingNewChatLoading(true);
      const chatRef = ref(realtime, `chats`);
      chatDetails = await push(chatRef, {
        type: "private",
        members: {
          [user?.uid]: true,
          [selectedUser?.id]: true,
        },
      });
    }

    if (chatDetails) {
      const userRef = ref(realtime, `users/${user?.uid}/chats`);
      await update(userRef, {
        [chatDetails.key]: true,
      });

      const userRef1 = ref(realtime, `users/${selectedUser?.id}/chats`);
      await update(userRef1, {
        [chatDetails.key]: true,
      });
    }

    const messageRef = ref(realtime, `messages/${chatDetails.key}`);
    await push(messageRef, {
      text: newMessage,
      sender: user?.uid,
      timestamp: Date.now(),
    });

    setIsAddingNewChatLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="underline font-medium">Realtime</p>
      <div className="flex flex-row gap-5">
        <div className="border border-gray-300 rounded-xl p-4">
          <div className="flex flex-row items-center justify-between mb-1 gap-2">
            <p className="text-purple-500">All Chats</p>
            <p>Total Chats: {Object.keys(chats)?.length}</p>
          </div>

          {isChatsLoading ? (
            <div className="flex items-center justify-center w-14 h-14 m-auto">
              <LoadingAnimation />
            </div>
          ) : !chats ? (
            <p className="text-gray-500">No chats found</p>
          ) : (
            <ul className="flex flex-col gap-2 items-center justify-center">
              {Object.keys(chats)?.map((chat) => (
                <li
                  key={chat}
                  className="p-2 bg-gray-100 rounded-lg w-full cursor-pointer hover:bg-gray-200 duration-300"
                  onClick={() => setSelectedChat(chat)}
                >
                  <p>{chat}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-gray-300 rounded-xl p-4">
          <p className="text-purple-500">Add new chat</p>
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2 items-center justify-between">
              <label>Select user to chat</label>
              <p className="text-sm">
                Total users: {allUsers && Object.keys(allUsers)?.length}
              </p>
            </div>
            {allUsers && Object.keys(allUsers)?.length > 0 ? (
              <select
                className="bg-gray-100 rounded-lg outline-none px-2"
                value={selectedUser?.name}
                onChange={(e) =>
                  setSelectedUser({
                    name: e.target.value,
                    id: e.target.value,
                  })
                }
              >
                <option hidden>Select user</option>
                {Object.keys(allUsers)?.map(
                  (item) =>
                    allUsers[item]?.info?.name !== user?.displayName && (
                      <option key={item} value={item}>
                        {allUsers[item]?.info?.name}
                      </option>
                    )
                )}
              </select>
            ) : (
              <p className="text-gray-500">No users found</p>
            )}
            <label htmlFor="message">Send message</label>
            <input
              type="text"
              id="message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="px-2 py-1 rounded-xl bg-gray-100 outline-none"
            ></input>
            {isAddingNewChatLoading ? (
              <div className="flex items-center justify-center w-14 h-14 m-auto">
                <LoadingAnimation />
              </div>
            ) : (
              <button
                onClick={handleAddNewChat}
                className="rounded-xl px-4 p-1 text-white bg-purple-500"
              >
                Add
              </button>
            )}
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl p-4 h-full">
          <p className="text-purple-500">Open chat (add, edit, delete)</p>
          {!chatMessages ? (
            <p className="text-gray-500">Please select a chat</p>
          ) : (
            <>
              <div className="w-full h-full">
                {chatMessages?.map((message) => (
                  <div
                    key={message?.id}
                    className={`flex flex-row item-center mb-1 ${
                      message?.sender === user?.uid
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <p
                      className={`rounded-md ${
                        message?.sender === user?.uid
                          ? "bg-black text-white rounded-tr-none"
                          : "bg-gray-200 rounded-tl-none"
                      } px-2 text-sm`}
                    >
                      {message?.text}
                    </p>
                    {message?.sender === user?.uid && (
                      <>
                        <button
                          className="cursor-pointer text-cyan-500"
                          onClick={() => {
                            setEditMessage(message?.id);
                            setMessage(message?.text);
                          }}
                        >
                          <svg
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth="0"
                            viewBox="0 0 24 24"
                            height="20px"
                            width="20px"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path fill="none" d="M0 0h24v24H0z"></path>
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
                          </svg>
                        </button>
                        <button
                          className="cursor-pointer text-red-500"
                          onClick={() => handleDeleteMessage(message?.id)}
                        >
                          <svg
                            stroke="currentColor"
                            fill="currentColor"
                            stroke-width="0"
                            viewBox="0 0 24 24"
                            height="20px"
                            width="20px"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M17 4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7V2H17V4ZM9 9V17H11V9H9ZM13 9V17H15V9H13Z"></path>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-row gap-1 border border-gray-400 rounded-md px-1">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="outline-none"
                />
                <button
                  className="cursor-pointer"
                  onClick={editMessage ? handleEditMessage : handleSendMessage}
                >
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 512 512"
                    height="20px"
                    width="20px"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M48 448l416-192L48 64v149.333L346 256 48 298.667z"></path>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Realtime;
