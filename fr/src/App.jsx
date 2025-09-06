import { useState, useEffect, useRef } from 'react';
import { Search, Activity, AlertTriangle, TrendingUp, Database, Clock, Shield, Target, Download } from 'lucide-react';
import './App.css';

function App() {
  const [genomicId, setGenomicId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const fileInputRef = useRef();

  const analyze = async () => {
    if (!genomicId.trim()) {
      alert("Please enter a genomic ID.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/analyze/${genomicId}`);
      const data = await res.json();
      setResult(data);
      
      // Add to history
      const historyEntry = {
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      setAnalysisHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Batch analyze function for JSON file
  const handleJsonFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ids = JSON.parse(text);
      if (!Array.isArray(ids)) {
        alert("JSON file must contain an array of genomic IDs.");
        return;
      }
      setLoading(true);
      setBatchResults([]); // Clear previous batch results
      for (const id of ids) {
        try {
          const res = await fetch(`http://127.0.0.1:8000/analyze/${id}`);
          const data = await res.json();
          // Append each result as soon as it arrives
          setBatchResults(prev => [...prev, { ...data, genomic_id: id }]);
        } catch (error) {
          setBatchResults(prev => [...prev, { genomic_id: id, error: "Failed to analyze." }]);
        }
      }
    } catch (err) {
      alert("Invalid JSON file.");
    } finally {
      setLoading(false);
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyze();
    }
  };

  const getDangerColorClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'danger-high';
      case 'medium': return 'danger-medium';
      case 'low': return 'danger-low';
      default: return 'danger-unknown';
    }
  };

  const getPathogenIcon = (isPathogen) => {
    return isPathogen ? 
      <AlertTriangle className="pathogen-icon pathogen-danger" /> : 
      <Shield className="pathogen-icon pathogen-safe" />;
  };

  // Download report as text file
  const handleDownloadReport = () => {
    if (!result?.report) return;
    const blob = new Blob([result.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genomic_report_${result.genomic_id || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="header-title">
              <Activity className="header-icon" />
              <div>
                <h1 className="main-title">
                  Genomics Surveillance System
                </h1>
                <p className="main-subtitle">
                  AI-powered pathogen monitoring and evolution prediction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-header">
            <h2 className="section-title">
              Pathogen Genomic Analysis
            </h2>
            <p className="section-subtitle">
              Enter a genomic accession ID to analyze pathogen characteristics and evolution potential
            </p>
          </div>
          
          <div className="search-form">
            <div className="input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Enter genomic ID (e.g., NC_045512, NM_001301717)"
                value={genomicId}
                onChange={(e) => setGenomicId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="search-input"
              />
            </div>
            <button 
              onClick={analyze}
              disabled={loading}
              className={`analyze-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Target className="button-icon" />
                  <span>Analyze Pathogen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* JSON Batch Upload Section */}
        <div className="batch-upload-section">
          <label htmlFor="json-upload" className="batch-label">
            Or upload a JSON file with an array of genomic IDs:
          </label>
          <input
            type="file"
            accept=".json,application/json"
            id="json-upload"
            ref={fileInputRef}
            onChange={handleJsonFile}
            className="batch-input"
          />
        </div>

        {/* Results Section */}
        {result && (
          <div className="results-section">
            <div className="section-header">
              <Database className="section-icon" />
              <h2 className="section-title">Analysis Results</h2>
            </div>
            
            <div className="results-grid">
              {/* Genomic ID Card */}
              <div className="result-card genomic-id-card">
                <h3 className="card-label">Genomic ID</h3>
                <p className="card-value genomic-id-value">{result.genomic_id}</p>
              </div>
              
              {/* Organism Card */}
              <div className="result-card organism-card">
                <h3 className="card-label">Organism</h3>
                <p className="card-value">{result.organism || 'Unknown'}</p>
              </div>
              
              {/* Pathogen Status Card */}
              <div className={`result-card pathogen-card ${result.is_pathogen ? 'pathogen-positive' : 'pathogen-negative'}`}>
                <div className="card-header">
                  {getPathogenIcon(result.is_pathogen)}
                  <h3 className="card-label">Pathogen Status</h3>
                </div>
                <p className="card-value">
                  {result.is_pathogen ? 'Pathogenic' : 'Non-Pathogenic'}
                </p>
              </div>
              
              {/* Danger Level Card */}
              <div className={`result-card danger-card ${getDangerColorClass(result.danger_level)}`}>
                <h3 className="card-label">Threat Level</h3>
                <p className="card-value">{result.danger_level || 'Unknown'}</p>
              </div>
            </div>

            {/* AI Report Section */}
            {result.report && (
              <div className="genomic-summary-card">
                <h3 className="summary-title">Genomic Analysis Summary</h3>
                <div className="summary-content">
                  {result.report.split('\n').map((line, idx) => {
                    // Format each line as a key-value pair if possible
                    const match = line.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
                    if (match) {
                      return (
                        <div key={idx} className="summary-row">
                          <span className="summary-label">{match[1]}:</span>
                          <span className="summary-value">{match[2]}</span>
                        </div>
                      );
                    }
                    // Otherwise, show as a paragraph
                    return <p key={idx} className="summary-text">{line}</p>;
                  })}
                </div>
                <button
                  className="download-report-btn"
                  onClick={handleDownloadReport}
                  title="Download Report"
                >
                  <Download className="download-icon" />
                  Download Report
                </button>
              </div>
            )}

            {/* Evolution Monitoring Alert */}
            {result.is_pathogen && (
              <div className="surveillance-alert">
                <div className="alert-content">
                  <AlertTriangle className="alert-icon" />
                  <div className="alert-text">
                    <h4 className="alert-title">
                      Surveillance Recommendation
                    </h4>
                    <p className="alert-description">
                      This pathogen requires continuous genomic monitoring for mutation tracking, 
                      variant emergence detection, and evolution pattern analysis. Consider implementing 
                      regular sequencing protocols and phylogenetic analysis for public health surveillance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batch Results Section */}
        {batchResults.length > 0 && (
          <div className="results-section">
            <div className="section-header">
              <Database className="section-icon" />
              <h2 className="section-title">Batch Analysis Results</h2>
            </div>
            <div className="results-grid">
              {batchResults.map((result, idx) => (
                <div key={idx} className="result-card">
                  <h3 className="card-label">Genomic ID</h3>
                  <p className="card-value">{result.genomic_id}</p>
                  <h3 className="card-label">Organism</h3>
                  <p className="card-value">{result.organism || 'Unknown'}</p>
                  <h3 className="card-label">Pathogen Status</h3>
                  <p className="card-value">
                    {result.is_pathogen ? 'Pathogenic' : 'Non-Pathogenic'}
                  </p>
                  <h3 className="card-label">Threat Level</h3>
                  <p className="card-value">{result.danger_level || 'Unknown'}</p>
                  {result.report && (
                    <div className="report-content">
                      <div className="report-text">{result.report}</div>
                    </div>
                  )}
                  {result.error && (
                    <div className="error-text">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="history-section">
            <div className="section-header">
              <Clock className="section-icon" />
              <h2 className="section-title">Recent Analysis History</h2>
            </div>
            
            <div className="history-list">
              {analysisHistory.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-content">
                    <div className="history-details">
                      <code className="history-id">{entry.genomic_id}</code>
                      <span className="history-organism">{entry.organism}</span>
                      {getPathogenIcon(entry.is_pathogen)}
                      <span className={`history-danger ${getDangerColorClass(entry.danger_level)}`}>
                        {entry.danger_level}
                      </span>
                    </div>
                    <span className="history-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="info-cards">
          <div className="info-card monitoring-card">
            <h3 className="info-title">Real-time Monitoring</h3>
            <p className="info-description">
              Continuous surveillance of pathogen genomic sequences to detect emerging variants and mutations.
            </p>
          </div>
          
          <div className="info-card prediction-card">
            <h3 className="info-title">Evolution Prediction</h3>
            <p className="info-description">
              AI-powered analysis to forecast pathogen evolution patterns and potential resistance development.
            </p>
          </div>
          
          <div className="info-card impact-card">
            <h3 className="info-title">Public Health Impact</h3>
            <p className="info-description">
              Early warning systems to support timely public health responses and effective disease control measures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;