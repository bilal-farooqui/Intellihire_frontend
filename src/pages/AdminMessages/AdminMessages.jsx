import { useEffect, useState } from 'react'
import { getMessages, createMessage, markMessageRead } from '../../api'
import '../adminShell/AdminShell.css'

function AdminMessages() {
  const [items, setItems] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const fetchMessages = async () => {
    try {
      const res = await getMessages()
      setItems(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const send = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    const row = {
      from_sender: 'You',
      subject: subject.trim(),
      preview: body.trim().slice(0, 200),
      read: true
    }
    try {
      await createMessage(row)
      await fetchMessages()
      setSubject('')
      setBody('')
    } catch (err) {
      console.error(err)
    }
  }

  const markRead = async (id) => {
    // Optimistic UI update
    setItems(items.map((m) => (m._id === id ? { ...m, read: true } : m)))
    try {
      await markMessageRead(id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Messages</h1>
      <p className="admin-shell-sub">
        Internal scratchpad inbox securely backed up to the database.
      </p>

      <div className="admin-two-col">
        <div className="admin-shell-card">
          <h2>Inbox</h2>
          <div className="admin-msg-list">
            {items.map((m) => (
              <div
                key={m._id}
                className={`admin-msg-item ${m.read ? '' : 'unread'}`}
                onClick={() => markRead(m._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && markRead(m._id)}
              >
                <div className="msg-subject">{m.subject}</div>
                <div className="msg-meta">
                  {m.from_sender} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div className="msg-preview">{m.preview}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-shell-card">
          <h2>New note</h2>
          <form className="admin-msg-compose" onSubmit={send}>
            <div className="admin-field">
              <label htmlFor="msg-subject">Subject</label>
              <input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Reminder title"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="msg-body">Message</label>
              <textarea
                id="msg-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your note…"
              />
            </div>
            <button type="submit" className="admin-btn-primary">
              Save to inbox
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminMessages
