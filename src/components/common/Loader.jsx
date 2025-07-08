import './Loader.css';

const Loader = () => {
  return (
    <div className='loader-container'>
      <div className='loader-content'>
        <h2>Cargando el Pluniverse...</h2>
        <div className='loader-spinner' />
      </div>
    </div>
  );
};

export default Loader;
