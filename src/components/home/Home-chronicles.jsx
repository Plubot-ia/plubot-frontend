import './Home-chronicles.css';

const HomeChronicles = () => {
  return (
    <section className='plubot-chronicles'>
      <h2>Crónicas</h2>
      <div className='chronicles-container'>
        <div className='chronicle-card'>
          <p>“Mi Plubot es mi escudo.”</p>
          <span>— Leo, Mercader</span>
        </div>
        <div className='chronicle-card'>
          <p>“Velina me devolvió las estrellas.”</p>
          <span>— Marina, Forjadora</span>
        </div>
      </div>
    </section>
  );
};

export default HomeChronicles;
