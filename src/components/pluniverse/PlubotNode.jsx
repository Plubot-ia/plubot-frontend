const PlubotNode = ({ data }) => {
    return (
      <div className="plubot-node">
        <div className="node-label">{data.label}</div>
      </div>
    );
  };
  
  export default PlubotNode;