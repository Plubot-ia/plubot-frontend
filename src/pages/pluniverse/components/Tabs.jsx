import PropTypes from 'prop-types';

const Tabs = ({ tabs, activeTab, setActiveTab }) => (
  <div className='tabs-container'>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default Tabs;
