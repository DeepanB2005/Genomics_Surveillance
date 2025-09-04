// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";

function App() {
  const [variant, setVariant] = useState("BA.5");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (variant) {
      fetch(`http://localhost:8000/variant-trends/${variant}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Error: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((json) => {
          if (json && json.data) {
            setData(json.data);
          } else if (json.error) {
            alert(json.error); // Display backend error
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to fetch data. Please try again.");
        });
    }
  }, [variant]);

  const chartData = data
    ? {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: `Prevalence of ${variant}`,
            data: data.map((d) => d.prevalence),
            borderColor: "blue",
            fill: false,
          },
        ],
      }
    : null;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Genomics Surveillance Dashboard</h2>
      <input
        type="text"
        value={variant}
        onChange={(e) => setVariant(e.target.value)}
        placeholder="Enter variant (e.g., BA.5)"
      />
      <button onClick={() => setVariant(variant)}>Fetch</button>

      {chartData ? (
        <Line data={chartData} />
      ) : (
        <p>Enter a variant to see trends</p>
      )}
    </div>
  );
}

export default App;
