// App.jsx
import { useState } from 'react'

function App() {
  const [genomicId, setGenomicId] = useState('')
  const [result, setResult] = useState(null)

  const analyze = async () => {
    const res = await fetch(`http://127.0.0.1:8000/analyze/${genomicId}`)
    const data = await res.json()
    setResult(data)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Genomic Pathogen Analyzer</h1>
      <input
        type="text"
        placeholder="Enter genomic ID (e.g., NC_045512)"
        value={genomicId}
        onChange={(e) => setGenomicId(e.target.value)}
        className="border p-2 m-2"
      />
      <button onClick={analyze} className="bg-blue-500 text-white px-4 py-2">
        Analyze
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl">Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default App
