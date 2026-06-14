import { useState, useEffect } from 'react'
import { getMyProfile, completeOnboarding } from '../../api'
import { 
  User, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Briefcase, 
  Edit3, 
  Save, 
  X,
  Loader2,
  Check,
  Globe,
  Mail,
  Link,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ApplicantProfile.css'

function ApplicantProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
   const [editMode, setEditMode] = useState(false)
  const [profile, setProfile] = useState(null)
  
  // Image states
  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  
  // Editable fields
  const [formData, setFormData] = useState({
    name: '',
    job_title: '',
    company: '',
    location: '',
    headline: '',
    bio: '',
    contact_info: '',
    hyperlinks: '',
    linkedin_url: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await getMyProfile()
      const data = res.data
      setProfile(data)
      
      // Populate form data
      const dist = data.distilled_profile || { profile: {}, supplies: [] }
      setFormData({
        name: dist.profile?.name || data.full_name || '',
        job_title: dist.profile?.job_title || '',
        company: dist.profile?.company || '',
        location: dist.profile?.location || '',
        headline: dist.profile?.headline || '',
        bio: dist.profile?.bio || data.bio || '',
        contact_info: dist.profile?.contact_info || '',
        hyperlinks: dist.profile?.hyperlinks || '',
        linkedin_url: data.linkedin_url || ''
      })
      setAvatarPreview(data.profile_picture || null)
      setBannerPreview(data.banner_picture || null)
    } catch (err) {
      console.error('Fetch Profile Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedDistilled = {
        ...profile.distilled_profile,
        profile: {
          ...profile.distilled_profile.profile,
          ...formData
        }
      }

      const payload = {
        linkedin_url: formData.linkedin_url,
        bio: formData.bio,
        distilled_profile: updatedDistilled,
        profile_picture: avatarPreview,
        banner_picture: bannerPreview
      }

      await completeOnboarding(payload) // Re-using this as it updates the same fields
      await fetchProfile()
      setEditMode(false)
    } catch (err) {
      console.error('Save Profile Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'avatar') {
        setAvatar(file)
        setAvatarPreview(reader.result)
      } else {
        setBanner(file)
        setBannerPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader2 className="spin" size={40} />
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="applicant-profile-container animate-in">
      <div className="profile-header-card">
        <div className="profile-info-row">
          <div className="avatar-wrapper">
            {avatarPreview && avatarPreview.trim() !== "" ? (
              <img src={avatarPreview} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder avatar-initials">
                {formData.name ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
            )}
            {editMode && (
              <>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => handleImageChange(e, 'avatar')} 
                />
                <button className="edit-avatar-btn" onClick={() => document.getElementById('avatar-upload').click()}>
                  <Edit3 size={14} />
                </button>
              </>
            )}
          </div>

          <div className="header-text">
            <h1>{formData.name}</h1>
            <p className="headline-text">{formData.headline}</p>
            <div className="meta-info">
              <span><Briefcase size={14} /> {formData.job_title} at {formData.company}</span>
              <span><MapPin size={14} /> {formData.location}</span>
            </div>
          </div>

          <div className="header-actions">
            {!editMode ? (
              <div className="profile-action-stack">
                <button className="profile-edit-btn" onClick={() => setEditMode(true)}>
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button className="ai-distiller-btn" onClick={() => navigate('/applicant/onboarding')}>
                  <Sparkles size={16} /> Update AI Profile
                </button>
              </div>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => setEditMode(false)}><X size={16} /> Cancel</button>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-main-grid">
        <div className="profile-left-col">
          <div className="profile-section-card">
            <h3>About</h3>
            {!editMode ? (
              <p className="bio-display">{formData.bio}</p>
            ) : (
              <div className="edit-group">
                <label>Professional Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={6}
                />
              </div>
            )}
          </div>

          <div className="profile-section-card">
            <h3>Supply (Capabilities)</h3>
            <div className="capabilities-grid">
              {profile?.distilled_profile?.supplies?.map((item, idx) => (
                <div key={idx} className="capability-item">
                  <div className="cap-check"><Check size={12} /></div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-right-col">
          <div className="profile-section-card">
            <h3>Contact & Links</h3>
            <div className="contact-list">
              <div className="contact-item">
                <Mail size={16} />
                <div className="contact-label">
                  <span>Email</span>
                  <p>{profile?.email}</p>
                </div>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <div className="contact-label">
                  <span>Phone</span>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={formData.contact_info}
                      onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
                    />
                  ) : (
                    <p>{formData.contact_info || <span className="empty-state">Not Provided</span>}</p>
                  )}
                </div>
              </div>
              <div className="contact-item">
                <Link size={16} />
                <div className="contact-label">
                  <span>LinkedIn</span>
                  {editMode ? (
                    <input 
                      type="url" 
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                    />
                  ) : formData.linkedin_url ? (
                    <a href={formData.linkedin_url} target="_blank" rel="noreferrer">View Profile</a>
                  ) : (
                    <p><span className="empty-state add-link" onClick={() => setEditMode(true)}>+ Add Link</span></p>
                  )}
                </div>
              </div>
              <div className="contact-item">
                <Globe size={16} />
                <div className="contact-label">
                  <span>Portfolio/Links</span>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={formData.hyperlinks}
                      onChange={(e) => setFormData({...formData, hyperlinks: e.target.value})}
                    />
                  ) : (
                    <p>{formData.hyperlinks || <span className="empty-state add-link" onClick={() => setEditMode(true)}>+ Add Link</span>}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="profile-section-card edit-basics">
              <h3>Basic Info</h3>
              <div className="edit-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="edit-group">
                <label>Headline</label>
                <input 
                  type="text" 
                  value={formData.headline}
                  onChange={(e) => setFormData({...formData, headline: e.target.value})}
                />
              </div>
              <div className="edit-row">
                <div className="edit-group">
                  <label>Job Title</label>
                  <input 
                    type="text" 
                    value={formData.job_title}
                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  />
                </div>
                <div className="edit-group">
                  <label>Company</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>
              <div className="edit-group">
                <label>Location</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicantProfile
