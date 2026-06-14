import { useState } from 'react'
import { analyzeCVs, BACKEND_URL } from '../../../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trophy, XCircle, CheckCircle, Info, FileText, MessageSquare } from 'lucide-react'
import './AIFiltering.css'

function AIFiltering({ cvs, selectedPosition, onBack, onViewCV }) {
  const [results, setResults] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [selectedResult, setSelectedResult] = useState(null) // For Modal

  const handleAIFilter = async () => {
    if (cvs.length === 0) {
      setError('No CVs available to analyze for this position.')
      return
    }

    try {
      setIsAnalyzing(true)
      setError('')
      
      const formData = new FormData()
      formData.append('job_description', `Position: ${selectedPosition}. Please analyze these CVs against the requirements for this role.`)
      
      const failedCVs = []
      let successCount = 0

      // Fetch files and append to formData
      for (const cv of cvs) {
        if (!cv.fileName) continue
        try {
          const response = await fetch(cv.fileName)
          if (!response.ok) {
            throw new Error(`File not found on server (HTTP ${response.status})`)
          }
          const blob = await response.blob()
          formData.append('files', blob, cv.fileName.split('/').pop())
          successCount++
        } catch (err) {
          console.error(`Failed to fetch file: ${cv.fileName}`, err)
          failedCVs.push({
            filename: cv.fileName.split('/').pop() || 'unknown.pdf',
            score: 0,
            error: `Failed to load CV: ${err.message || 'Unknown error'}`,
            ...cv
          })
        }
      }

      let backendResults = []
      if (successCount > 0) {
        const res = await analyzeCVs(formData)
        backendResults = res.data.map(result => {
          const originalCV = cvs.find(c => c.fileName.includes(result.filename))
          return {
            ...result,
            ...originalCV
          }
        })
      } else if (failedCVs.length === 0) {
        setError('No valid CV files found to analyze.')
        setIsAnalyzing(false)
        return
      }

      // Combine both successful results and failed ones
      const enrichedResults = [...backendResults, ...failedCVs]
      setResults(enrichedResults)
    } catch (err) {
      console.error('AI Filtering Error:', err)
      setError('Failed to run AI filtering. Please check your backend connection.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="ai-filtering">
      <div className="ai-header">
        <button className="btn-back" onClick={onBack}>← Back to List</button>
        <h3 className="ai-title">AI-Powered CV Filtering</h3>
      </div>

      {!results.length && !isAnalyzing && (
        <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ai-info-card"
          >
            <div className="info-icon">AI</div>
            <div className="info-content">
              <h4>Advanced AI Analysis</h4>
              <p>
                Our AI deep-scans every CV to understand candidate experience beyond keywords. 
                It identifies matching skills, gaps, and even generates personalized interview questions.
              </p>
            </div>
          </motion.div>

          <div className="ai-controls">
            <div className="control-group">
              <label className="control-label">Selected Position:</label>
              <div className="position-display">
                {selectedPosition || 'All Positions'}
              </div>
            </div>
            <div className="control-group">
              <label className="control-label">Total CVs to Analyze:</label>
              <div className="count-display">{cvs.length}</div>
            </div>
          </div>

          <div className="ai-action-section">
            <button 
              className="btn-ai-filter" 
              onClick={handleAIFilter}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Run AI Deep Scan'}
            </button>
            {error && <p className="error-text">{error}</p>}
            <p className="ai-note">
              This process may take a few moments as we perform a comprehensive 
              semantic analysis on each document.
            </p>
          </div>
        </>
      )}

      {isAnalyzing && (
        <div className="ai-loading-state">
          <div className="loader"></div>
          <h4>Deep Scanning CVs...</h4>
          <p>The AI engine is currently analyzing qualifications and matching skills.</p>
        </div>
      )}

      {results.length > 0 && !isAnalyzing && (
        <div className="ai-results-view">
          <div className="results-header">
            <h4>Ranked Recommendations</h4>
            <span className="results-count">{results.length} Candidates Analyzed</span>
          </div>
          
          <div className="candidates-grid">
            <AnimatePresence>
              {results.map((result, index) => (
                <motion.div 
                  key={result.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`candidate-card ${index === 0 ? 'top-match' : ''}`}
                >
                  {index === 0 && <div className="best-match-badge"><Trophy size={14} /> Best Match</div>}
                  
                  <div className="card-top">
                    <div className="candidate-info">
                      <h5>{result.applicantName}</h5>
                      <span className="file-name">{result.filename}</span>
                    </div>
                    <div className={`score-circle ${result.score > 70 ? 'high' : result.score > 40 ? 'medium' : 'low'}`}>
                      {result.score}%
                    </div>
                  </div>

                  <div className="card-analysis">
                    {result.error ? (
                      <div className="analysis-error-message">
                        <XCircle size={14} className="error-icon" />
                        <span>{result.error}</span>
                      </div>
                    ) : (
                      <>
                        <p className="summary-text">{result.summary}</p>
                        
                        <div className="skills-breakdown">
                          <div className="skill-section">
                            <span className="label"><CheckCircle size={12} /> Matching</span>
                            <div className="skill-chips">
                              {result.matching_skills?.slice(0, 3).map(s => <span key={s.skill} className="chip match">{s.skill}</span>)}
                              {result.matching_skills?.length > 3 && <span className="more">+{result.matching_skills.length - 3}</span>}
                            </div>
                          </div>
                          <div className="skill-section">
                            <span className="label"><XCircle size={12} /> Missing</span>
                            <div className="skill-chips">
                              {result.missing_skills?.slice(0, 3).map(s => <span key={s} className="chip miss">{s}</span>)}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="btn-details" onClick={() => setSelectedResult(result)}>
                      View Analysis
                    </button>
                    <button className="btn-view-cv" onClick={() => onViewCV(result)}>
                      Open CV
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <button className="btn-reset" onClick={() => setResults([])}>
            Run New Analysis
          </button>
        </div>
      )}

      {/* Analysis Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ai-modal-overlay"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="ai-modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedResult.applicantName} - Detailed Analysis</h3>
                <button className="close-modal" onClick={() => setSelectedResult(null)}>×</button>
              </div>
              
              <div className="modal-body">
                {selectedResult.error ? (
                  <div className="modal-error-message">
                    <XCircle size={32} />
                    <h4>Analysis Unsuccessful</h4>
                    <p>{selectedResult.error}</p>
                  </div>
                ) : (
                  <>
                    <section className="analysis-section">
                      <h4><Info size={18} /> AI Summary</h4>
                      <p>{selectedResult.summary}</p>
                    </section>

                    <div className="skills-grid">
                      <section className="analysis-section">
                        <h4><CheckCircle size={18} color="#28a745" /> Matching Skills</h4>
                        <div className="chip-container">
                          {selectedResult.matching_skills?.map(s => <span key={s.skill} className="modal-chip match">{s.skill}</span>)}
                          {selectedResult.matching_skills?.length === 0 && <p className="none-text">No significant matches found.</p>}
                        </div>
                      </section>
                      <section className="analysis-section">
                        <h4><XCircle size={18} color="#dc3545" /> Skill Gaps</h4>
                        <div className="chip-container">
                          {selectedResult.missing_skills?.map(s => <span key={s} className="modal-chip miss">{s}</span>)}
                          {selectedResult.missing_skills?.length === 0 && <p className="none-text">Candidate covers all key requirements!</p>}
                        </div>
                      </section>
                    </div>

                    <section className="analysis-section questions">
                      <h4><MessageSquare size={18} /> Recommended Interview Questions</h4>
                      <div className="questions-list">
                        {selectedResult.interview_questions?.map((q, i) => (
                          <div key={i} className="question-item">
                            <span className="q-num">{i + 1}</span>
                            <p>{q}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setSelectedResult(null)}>Close</button>
                <button className="btn-primary" onClick={() => onViewCV(selectedResult)}>View Resume</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIFiltering

