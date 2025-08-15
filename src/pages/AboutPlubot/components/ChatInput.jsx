import PropTypes from 'prop-types';

const ChatInput = ({ userInput, onUserInput, isLoading, handleSendMessage }) => (
  <form onSubmit={handleSendMessage} className='chat-input-container'>
    <input
      type='text'
      className='chat-input'
      value={userInput}
      onChange={onUserInput}
      placeholder='Pregunta a Byte sobre Plubot...'
      disabled={isLoading}
    />
    <button type='submit' className='chat-send-btn' disabled={isLoading || !userInput.trim()}>
      {isLoading ? (
        <span className='loader' />
      ) : (
        <>
          Enviar
          <span className='btn-glow' />
        </>
      )}
    </button>
  </form>
);

ChatInput.propTypes = {
  userInput: PropTypes.string.isRequired,
  onUserInput: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleSendMessage: PropTypes.func.isRequired,
};

export default ChatInput;
