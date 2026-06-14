import React, { useState } from 'react';
import { analyzeCVs } from '../../api';
import './AITester.css';

const AITester = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please upload at least one CV.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setExpandedRow(null);

    const formData = new FormData();
    formData.append('job_description', jobDescription);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await analyzeCVs(formData);
      setResults(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze CVs. Please make sure the backend is running and supports /api/ai/analyze-cvs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tester-container">
      <div className="ai-tester-header">
        <h1>AI CV Analyzer <span className="beta-badge">AI Powered</span></h1>
        <p>Upload multiple CVs and compare them against a job description using our Deep Analysis AI engine.</p>
      </div>

      <div className="ai-tester-grid">
        <div className="input-section card">
          <h3>1. Job Description</h3>
          <textarea
            placeholder="Paste the job description or requirements here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
          />
        </div>

        <div className="upload-section card">
          <h3>2. Upload CVs</h3>
          <div className="file-input-wrapper">
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileChange}
              id="cv-upload"
            />
            <label htmlFor="cv-upload" className="file-label">
              <i className="fas fa-cloud-upload-alt"></i>
              {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Choose files (PDF, DOCX)'}
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div className="file-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
          
          <button 
            className={`analyze-btn ${loading ? 'loading' : ''}`} 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Run Deep Analysis'}
          </button>
          
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {results.length > 0 && (
        <div className="results-section card animate-up">
          <div className="results-intro">
            <h3>Analysis Results</h3>
            <p className="results-info">Click on a row to see full AI insights & interview questions</p>
          </div>

          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate / Filename</th>
                  <th>Match Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <React.Fragment key={index}>
                    <tr 
                      className={`${index === 0 ? 'top-match' : ''} ${expandedRow === index ? 'expanded' : ''}`}
                      onClick={() => toggleRow(index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="filename-cell">
                          {result.filename} 
                          {index === 0 && <span className="top-badge">Best Match</span>}
                        </div>
                      </td>
                      <td>
                        <div className="score-container">
                          <div className="score-bar-bg">
                            <div 
                              className="score-bar-fill" 
                              style={{ width: `${result.score}%`, backgroundColor: getScoreColor(result.score) }}
                            ></div>
                          </div>
                          <span className="score-text" style={{ color: getScoreColor(result.score) }}>
                            {result.score}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="details-toggle-btn">
                          {expandedRow === index ? 'Hide Details' : 'View AI Insights'}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === index && (
                      <tr className="details-row">
                        <td colSpan="4">
                          <div className="expanded-details card">
                            <div className="details-grid">
                              <div className="detail-item full">
                                <h4><i className="fas fa-robot"></i> AI Summary & Logic</h4>
                                <p className="mb-2">{result.summary || 'No summary provided.'}</p>
                                {result.score_breakdown && result.score_breakdown.length > 0 && (
                                  <div className="score-breakdown">
                                    {result.score_breakdown.map((item, i) => (
                                      <div key={i} className="breakdown-tag">
                                        <i className="fas fa-chart-line"></i> {item}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="skill-split">
                                <div className="detail-item">
                                  <h4><i className="fas fa-check-circle" style={{color: '#10b981'}}></i> Matching Skills (with Proof)</h4>
                                  <div className="enriched-skills">
                                    {result.matching_skills?.map((s, i) => (
                                      <div key={i} className="skill-card">
                                        <div className="skill-header">
                                          <span className="skill-name">{typeof s === 'string' ? s : s.skill}</span>
                                          {s.evidence && <span className="proof-badge">Verified Evidence</span>}
                                        </div>
                                        {s.context && <p className="skill-context">{s.context}</p>}
                                        {s.evidence && (
                                          <blockquote className="skill-evidence">
                                            "{s.evidence}"
                                          </blockquote>
                                        )}
                                      </div>
                                    ))}
                                    {(!result.matching_skills || result.matching_skills.length === 0) && <span className="no-data">No major skills detected.</span>}
                                  </div>
                                </div>
                                <div className="detail-item">
                                  <h4><i className="fas fa-exclamation-circle" style={{color: '#ef4444'}}></i> Missing Potential</h4>
                                  <div className="skills-chips">
                                    {result.missing_skills?.map((s, i) => <span key={i} className="skill-chip miss">{s}</span>)}
                                    {(!result.missing_skills || result.missing_skills.length === 0) && <span className="no-data">Excellent coverage!</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="detail-item full">
                                <h4><i className="fas fa-question-circle"></i> Suggested Interview Questions</h4>
                                <ul className="ai-questions">
                                  {result.interview_questions?.map((q, i) => <li key={i}>{q}</li>)}
                                  {(!result.interview_questions || result.interview_questions.length === 0) && <li>No questions generated.</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#3b82f6'; // Blue
  if (score >= 40) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
};

const getStatusClass = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
};

const getStatusLabel = (score) => {
  if (score >= 80) return 'Highly Recommended';
  if (score >= 60) return 'Strong Match';
  if (score >= 40) return 'Potential Match';
  return 'Low Match';
};

export default AITester;
