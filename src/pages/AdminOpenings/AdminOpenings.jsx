import { useEffect, useState, useRef } from 'react'
import { createJob, getAllJobs, deleteJob, BACKEND_URL } from '../../api'
import axios from 'axios'
import toast from 'react-hot-toast'
import './AdminOpenings.css'

const AI_SYSTEM_PROMPT = `You are an expert, conversational AI HR Assistant for an internal recruitment portal. Your sole objective is to help hiring managers (who are often non-technical) create and fill out a "Add New Opening" job form through a natural, friendly chat.

Your target form fields are:
- job_title
- description (A concise, professional summary of the role)
- location (e.g., Remote, Karachi, Hybrid)
- requirements (A comma-separated string of key skills, e.g., "React, Node.js, MongoDB")
- salary_range (e.g., "Rs 100k - 150k")

### BEHAVIORAL RULES:
1. CONVERSATIONAL & EASY: Speak in a helpful, approachable tone. Do not overwhelm the manager with all questions at once. Ask 1 or 2 simple questions at a time.
2. BRIDGE THE TECH GAP: If the manager says "I need someone to build a website front-end", you should automatically figure out and suggest relevant industry-standard technical titles and requirements (e.g., React, HTML, CSS, JavaScript, Vite) instead of asking them to name the specific technologies.
3. INFER & SUGGEST: Draft a professional 'description' and 'requirements' list based on their casual input, and ask them for confirmation (e.g., "Great, I've drafted a description and added skills like React and Tailwind. Does that look good?").
4. EXTRACTION GOAL: Keep the conversation going until you have gathered or generated valid data for all 5 fields.

### OUTPUT FORMAT:
Once the manager agrees with the finalized details, or when all 5 fields are completely ready, you MUST conclude the conversation by outputting a valid JSON object wrapped inside a markdown code block. Do not ask any more questions after providing the JSON.

The JSON format must strictly look like this:
\`\`\`json
{
  "job_title": "string",
  "description": "string",
  "location": "string",
  "requirements": "string, string, string",
  "salary_range": "string"
}
\`\`\`
`;

function AdminOpenings() {
  const [openings, setOpenings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    isActive: true
  })

  // AI Assistant Chat state
  const [isAiMode, setIsAiMode] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI Recruitment Assistant. I can help you draft a new job opening. What role are you looking to hire for today?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatScrollRef = useRef(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getAllJobs()
        setOpenings(res.data || [])
      } catch (err) {
        console.error('Error loading jobs', err)
        setError('Failed to load job openings')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', text: chatInput }
    const updatedMessages = [...chatMessages, userMsg]
    setChatMessages(updatedMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const formattedPrompt = `${AI_SYSTEM_PROMPT}

Chat History:
${updatedMessages.map(m => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.text}`).join('\n')}
User: ${chatInput}
Assistant:`;

      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        prompt: formattedPrompt
      })

      const replyText = res.data.response || "I couldn't process that. Please try again."
      setChatMessages(prev => [...prev, { role: 'ai', text: replyText }])

      // Extract JSON from response if present
      const jsonMatch = replyText.match(/```json\s*(\{[\s\S]*?\})\s*```/) || replyText.match(/(\{[\s\S]*?\})/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.job_title || data.description) {
            setFormData({
              title: data.job_title || '',
              description: data.description || '',
              requirements: data.requirements || '',
              location: data.location || '',
              salaryRange: data.salary_range || '',
              isActive: true
            });
            toast.success("Job details drafted successfully!");
            setIsAiMode(false);
          }
        } catch (err) {
          console.error("JSON parsing failed", err);
        }
      }
    } catch (err) {
      console.error("AI Chat Error", err)
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I had trouble communicating with the AI. Please try again." }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')

      const payload = {
        title: formData.title,
        description: formData.description || 'Job description',
        requirements: formData.requirements
          ? formData.requirements.split(',').map((r) => r.trim()).filter(Boolean)
          : [],
        location: formData.location || 'Remote',
        salary_range: formData.salaryRange || 'Not Disclosed',
        is_active: formData.isActive
      }

      await createJob(payload)

      // Refresh list
      const res = await getAllJobs()
      setOpenings(res.data || [])

      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        isActive: true
      })
      toast.success('Job opening created')
    } catch (err) {
      console.error('Error creating job', err)
      setError('Failed to create job opening')
      toast.error('Failed to create job opening')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (jobId) => {
    toast.custom(
      (t) => (
        <div className="hiring-toast-confirm">
          <p className="hiring-toast-confirm-message">
            Are you sure you want to delete this job opening? This will permanently delete all associated applications and interviews.
          </p>
          <div className="hiring-toast-confirm-actions">
            <button
              type="button"
              className="hiring-toast-btn hiring-toast-btn-cancel"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="hiring-toast-btn hiring-toast-btn-danger"
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  setLoading(true)
                  await deleteJob(jobId)
                  toast.success('Job opening deleted successfully')

                  // Refresh list
                  const res = await getAllJobs()
                  setOpenings(res.data || [])
                } catch (err) {
                  console.error('Error deleting job:', err)
                  toast.error('Failed to delete job opening')
                } finally {
                  setLoading(false)
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    )
  }

  return (
    <div className="admin-openings-page">
      <h1 className="admin-shell-title">Manage Openings</h1>

      <div className="openings-grid">
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-heading" style={{ margin: 0 }}>Add New Opening</h2>
            <button
              type="button"
              className="ai-toggle-btn"
              onClick={() => setIsAiMode(!isAiMode)}
              style={{
                background: isAiMode ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.1)',
                border: isAiMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(16,185,129,0.2)',
                color: isAiMode ? '#ecf2ff' : '#43f4b1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isAiMode ? 'Fill Manually' : 'Draft with AI'}
            </button>
          </div>

          {isAiMode ? (
            <div className="ai-chat-assistant-container" style={{ display: 'flex', flexDirection: 'column', height: '420px', background: 'rgba(10, 13, 20, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
              <div className="chat-messages" ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.06)',
                      color: msg.role === 'user' ? '#ffffff' : '#ecf2ff',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', color: '#8d97ad', fontSize: '13px', fontStyle: 'italic' }}>
                      AI is typing...
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input-bar" style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  style={{
                    flex: 1,
                    background: '#0B0F19',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  disabled={chatLoading}
                />
                <button
                  type="button"
                  onClick={handleSendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <form className="opening-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Job Title</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Short description"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Remote"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="requirements">Requirements (comma separated)</label>
                  <input
                    id="requirements"
                    type="text"
                    value={formData.requirements}
                    onChange={(e) => handleChange('requirements', e.target.value)}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="salaryRange">Salary Range</label>
                  <input
                    id="salaryRange"
                    type="text"
                    value={formData.salaryRange}
                    onChange={(e) => handleChange('salaryRange', e.target.value)}
                    placeholder="Rs 100k - 150k"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">Add Opening</button>
              </div>
            </form>
          )}
        </div>

        <div className="list-card">
          <h2 className="section-heading">Current Openings</h2>
          {loading && <div className="leaves-info">Loading openings...</div>}
          {error && !loading && <div className="leaves-error">{error}</div>}
          <div className="openings-list">
            {!loading && !error && openings.map((opening) => (
              <div key={opening._id} className="opening-row">
                <div className="opening-info">
                  <div className="opening-title">{opening.title}</div>
                  <div className="opening-meta">
                    <span>{opening.location}</span>
                    <span className="dot">•</span>
                    <span>{opening.salary_range}</span>
                  </div>
                </div>
                <div className="opening-status">
                  <span className={`status-badge ${opening.is_active ? 'active' : 'closed'}`}>
                    {opening.is_active ? 'Active' : 'Closed'}
                  </span>
                  <div className="opening-date">
                    Posted:{' '}
                    {opening.created_at
                      ? new Date(opening.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '-'}
                  </div>
                  <button
                    onClick={() => handleDelete(opening._id)}
                    className="delete-opening-btn"
                    title="Delete this opening"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!loading && !error && openings.length === 0 && (
              <div className="no-openings">
                <p>No openings yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOpenings
