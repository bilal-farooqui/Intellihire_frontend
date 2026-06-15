import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Minimize2, MessageSquare } from 'lucide-react'
import axios from 'axios'
import { BACKEND_URL } from '../../../../api'
import './HiringAssistant.css'

function HiringAssistant({ candidates }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Recruitment Assistant. I have analyzed the candidates. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Create a context summary of candidates for the AI
      const candidateContext = candidates.map(c => 
        `Name: ${c.applicantName}, Score: ${c.score}%, Summary: ${c.summary}, Matching Skills: ${c.matching_skills?.join(', ')}`
      ).join('\n\n')

      const prompt = `
        You are an AI Hiring Assistant. Below is the data for the current pool of candidates. 
        Answer the recruiter's question based ONLY on this data.
        
        CANDIDATES DATA:
        ${candidateContext}
        
        USER QUESTION:
        ${input}
        
        Keep your answer professional, concise, and helpful.
      `

      // We can use a generic AI endpoint if we had one, 
      // but for this FYP, let's assume we can hit the AI engine we built
      // or a dedicated chat endpoint. 
      // For now, I'll simulate a high-quality response if no endpoint is ready, 
      // or I can add a simple /chat endpoint to the backend.
      
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        prompt: prompt
      })

      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }])
    } catch (err) {
      console.error('Chat Error:', err)
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again later.' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="hiring-assistant-container">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            className="assistant-trigger"
            onClick={() => setIsOpen(true)}
          >
            <Bot size={28} />
            <span className="trigger-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="assistant-window"
          >
            <div className="assistant-header">
              <div className="header-info">
                <Bot size={20} />
                <span>Hiring Assistant</span>
              </div>
              <div className="header-actions">
                <button onClick={() => setIsOpen(false)}><Minimize2 size={16} /></button>
                <button onClick={() => setIsOpen(false)}><X size={16} /></button>
              </div>
            </div>

            <div className="messages-container" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`message-wrapper ${m.role}`}>
                  <div className="message-bubble">
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-wrapper ai">
                  <div className="message-bubble typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="input-container">
              <input 
                type="text" 
                placeholder="Ask about candidates..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button disabled={isTyping || !input.trim()} onClick={handleSend}>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HiringAssistant
