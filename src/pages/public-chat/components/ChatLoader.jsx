import { Loader } from 'lucide-react';
import React from 'react';

const ChatLoader = () => (
  <div className='chat-loader'>
    <Loader className='animate-spin' size={48} />
    <p>Cargando Chatbot...</p>
  </div>
);

export default ChatLoader;
