import PropTypes from 'prop-types';
import './Button.css';

const Button = ({ children, className = '', onClick, disabled = false, ...rest }) => {
  const combinedClassName = ['quantum-btn', className].filter(Boolean).join(' ');

  return (
    <button className={combinedClassName} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default Button;
