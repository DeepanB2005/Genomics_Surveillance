import { useState } from "react";

function App() {
  const [genomeId, setGenomeId] = useState("");
  const [result, setResult] = useState(null);

  const checkGenome = async () => {
    const res = await fetch(`http://127.0.0.1:8000/check_genome?genome_id=${genomeId}`);
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Pathogen Identifier</h1>
      <input
        type="text"
        placeholder="Enter genomic ID (e.g., NC_045512)"
        value={genomeId}
        onChange={(e) => setGenomeId(e.target.value)}
      />
      <button onClick={checkGenome} style={{ marginLeft: "10px" }}>
        Check
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Results:</h3>
          <p><strong>Genome ID:</strong> {result.genome_id}</p>
          <p><strong>Organism:</strong> {result.organism}</p>
          <p><strong>Is Pathogen?</strong> {String(result.is_pathogen)}</p>
          <p><strong>Danger Level:</strong> {result.danger_level}</p>
        </div>
      )}
    </div>
  );
}

export default App;
