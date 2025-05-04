import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let stompClient = null;

const ChatApp = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws'); // WebSocket endpoint from backend

    stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log('Connected to WebSocket');

        stompClient.subscribe('/topic/messages', (msg) => {
          const received = JSON.parse(msg.body);
          setMessages(prev => [...prev, received.content]);
        });
      },
      onStompError: (frame) => {
        console.error('Broker error:', frame.headers['message']);
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  const sendMessage = () => {
    if (stompClient && isConnected) {
      const payload = {
        sender: 'ReactUser',
        content: message
      };
      stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(payload)
      });
      setMessage('');
    }
  };

  return (
    <div>
      <h2>React WebSocket Chat</h2>
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
      <ul>
        {messages.map((msg, idx) => <li key={idx}>{msg}</li>)}
      </ul>
    </div>
  );
};

export default ChatApp;
