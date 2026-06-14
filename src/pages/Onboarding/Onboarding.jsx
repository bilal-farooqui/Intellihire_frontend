import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { distillOnboarding, completeOnboarding, uploadCv } from '../../api'
import LiquidEther from '../../components/LiquidEther/LiquidEther'
import { 
  Link, 
  User, 
  FileText, 
  Target, 
  Upload, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  Plus,
  Briefcase,
  Layers,
  MapPin,
  Phone,
  ExternalLink,
  Check
} from 'lucide-react'
import './Onboarding.css'

function Onboarding({ onComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: About, 2: Offer, 3: Review
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStaticBg, setIsStaticBg] = useState(() => {
    return localStorage.getItem('onboarding_static_bg') === 'true'
  })
  
  // Section 1: About
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  
  // Section 2: Offer
  const [cvFile, setCvFile] = useState(null)
  const [experienceFiles, setExperienceFiles] = useState([])
  
  // Section 3: AI Review (Distilled Data)
  const [distilledData, setDistilledData] = useState(null)
  const [reviewTab, setReviewTab] = useState('profile') // 'profile' | 'supply'

  const handleFileAdd = (files, setFiles) => {
    setFiles(prev => [...prev, ...Array.from(files)])
  }

  const handleRemoveFile = (index, setFiles) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerateProfile = async () => {
    setError('')
    if (!cvFile) {
      setError('Please upload your Primary CV/Resume (PDF) before generating your AI profile.')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('goals', '') 
      
      // Append primary CV
      formData.append('experience_files', cvFile)
      
      // Append additional experience files
      experienceFiles.forEach(file => formData.append('experience_files', file))

      const res = await distillOnboarding(formData)
      setDistilledData(res.data)
      setStep(3)
    } catch (err) {
      console.error('Distill Error:', err)
      setError(err?.response?.data?.detail || 'AI generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      let cvUrl = null
      if (cvFile) {
        const fileForm = new FormData()
        fileForm.append('file', cvFile)
        const cvRes = await uploadCv(fileForm)
        cvUrl = cvRes.data.cv_url
      }

      // Convert images to base64 for persistent storage
      const avatarBase64 = await fileToBase64(avatar)
      const bannerBase64 = await fileToBase64(banner)

      const payload = {
        linkedin_url: linkedinUrl,
        bio: distilledData.profile.bio,
        onboarding_completed: true,
        distilled_profile: distilledData,
        profile_picture: avatarBase64,
        banner_picture: bannerBase64,
        cv_url: cvUrl
      }

      await completeOnboarding(payload)

      if (onComplete) {
        onComplete(distilledData, cvUrl)
      }
      
      navigate('/applicant/openings')
    } catch (err) {
      console.error('Finish Error:', err)
      setError('Failed to save profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`onboarding-page ${isStaticBg ? 'static-bg' : ''}`}>
      {!isStaticBg && (
        <div className="onboarding-ether-bg">
          <LiquidEther
            colors={['#0f4e36', '#11c77d', '#43f4b1']}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
          />
        </div>
      )}

      <div className="bg-toggle-container">
        <label className="bg-switch" title="Toggle background animation">
          <input
            type="checkbox"
            checked={isStaticBg}
            onChange={(e) => {
              const val = e.target.checked
              setIsStaticBg(val)
              localStorage.setItem('onboarding_static_bg', val)
            }}
          />
          <span className="bg-slider round"></span>
        </label>
      </div>

      <div className="onboarding-container">
        <div className="onboarding-glass">
          <div className="onboarding-sidebar">
            <div className="onboarding-logo">HR SYSTEM</div>
            <div className="onboarding-steps">
              <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-num">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
                <div className="step-label">About You</div>
              </div>
              <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-num">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
                <div className="step-label">What You Offer</div>
              </div>
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                <div className="step-num">3</div>
                <div className="step-label">AI Review</div>
              </div>
            </div>
            <div className="onboarding-footer">
              <p>Step {step} of 3</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="onboarding-content">
            {step === 1 && (
              <div className="section-content animate-in">
                <div className="section-header">
                  <h2>Section 1: About You</h2>
                  <p>Build your professional foundation</p>
                </div>

                <div className="form-group">
                  <label>LINKEDIN PROFILE URL</label>
                  <div className="input-with-icon">
                    <Link size={18} className="icon" />
                    <input 
                      type="url" 
                      placeholder="https://linkedin.com/in/username" 
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>LINKEDIN BIO / SUMMARY</label>
                  <textarea 
                    placeholder="Paste your professional summary here..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="profile-uploads">
                  <div className="upload-box-mini">
                    <label>PROFILE PICTURE</label>
                    <div className="upload-area">
                      <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
                      {avatar ? (
                        <div className="preview-img"><img src={URL.createObjectURL(avatar)} alt="Avatar" /></div>
                      ) : (
                        <div className="avatar-dummy-placeholder">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="upload-box-mini">
                    <label>BANNER PICTURE</label>
                    <div className="upload-area banner">
                      <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])} />
                      {banner ? (
                        <div className="preview-img"><img src={URL.createObjectURL(banner)} alt="Banner" /></div>
                      ) : (
                        <div className="upload-placeholder"><Plus /> <span>Banner</span></div>
                      )}
                    </div>
                  </div>
                </div>

                <button type="button" className="next-btn" onClick={() => setStep(2)}>
                  Next Section <ChevronRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="section-content animate-in">
                <div className="section-header">
                  <h2>Section 2: What You Offer</h2>
                  <p>Showcase your experience and skills</p>
                </div>

                <div className="form-group">
                  <label>PRIMARY CV / RESUME (Required - PDF Only) <span className="info-icon" title="This CV will be saved to your profile and automatically pre-filled when you apply to jobs.">ⓘ</span></label>
                  <div className="dropzone-area">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setCvFile(e.target.files[0] || null)}
                    />
                    <div className="dropzone-content">
                      <Upload size={32} className="upload-icon" style={{ color: cvFile ? '#43f4b1' : 'inherit' }} />
                      {cvFile ? (
                        <p style={{ color: '#43f4b1', fontWeight: 600 }}>Selected: {cvFile.name}</p>
                      ) : (
                        <p>Click or drag your primary CV here</p>
                      )}
                      <span>PDF ONLY — REQUIRED FOR JOB APPLICATIONS</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>ADDITIONAL EXPERIENCE DOCS (Optional) <span className="info-icon" title="Upload additional documents like certifications, transcripts, exports or professional bios.">ⓘ</span></label>
                  <div className="dropzone-area">
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.docx" 
                      onChange={(e) => handleFileAdd(e.target.files, setExperienceFiles)}
                    />
                    <div className="dropzone-content">
                      <Upload size={32} className="upload-icon" />
                      <p>Click or drag additional files here</p>
                      <span>PDF, DOCX — LINKEDIN EXPORTS, NOTES, PORTFOLIOS</span>
                    </div>
                  </div>

                  <div className="file-list">
                    {experienceFiles.map((file, i) => (
                      <div key={i} className="file-item">
                        <FileText size={16} />
                        <span className="file-name">{file.name}</span>
                        <button type="button" onClick={() => handleRemoveFile(i, setExperienceFiles)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <div className="onboarding-error">{error}</div>}

                <div className="action-row">
                  <button type="button" className="back-btn" onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="submit-btn" disabled={loading} onClick={handleGenerateProfile}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="spin" /> Generating AI Profile...
                      </>
                    ) : (
                      'Generate AI Profile'
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && distilledData && (
              <div className="section-content animate-in review-section">
                <div className="review-tabs">
                  <button 
                    className={`tab-btn ${reviewTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setReviewTab('profile')}
                  >
                    <User size={16} /> PROFILE
                  </button>
                  <button 
                    className={`tab-btn ${reviewTab === 'supply' ? 'active' : ''}`}
                    onClick={() => setReviewTab('supply')}
                  >
                    <Briefcase size={16} /> SUPPLY
                  </button>
                </div>

                {reviewTab === 'profile' ? (
                  <div className="profile-grid">
                    <div className="review-card-row">
                      <div className="review-field">
                        <label>NAME</label>
                        <div className="field-val">{distilledData.profile.name}</div>
                      </div>
                      <div className="review-field">
                        <label>JOB TITLE</label>
                        <div className="field-val">{distilledData.profile.job_title}</div>
                      </div>
                    </div>
                    <div className="review-card-row">
                      <div className="review-field">
                        <label>COMPANY</label>
                        <div className="field-val">{distilledData.profile.company}</div>
                      </div>
                      <div className="review-field">
                        <label>LOCATION</label>
                        <div className="field-val"><MapPin size={14} /> {distilledData.profile.location}</div>
                      </div>
                    </div>
                    <div className="review-field full">
                      <label>HEADLINE</label>
                      <div className="field-val headline">"{distilledData.profile.headline}"</div>
                    </div>
                    <div className="review-field full bio-field">
                      <label>BIO</label>
                      <div className="field-val bio-text">{distilledData.profile.bio}</div>
                    </div>
                    <div className="review-card-row">
                      <div className="review-field">
                        <label>CONTACT INFORMATION</label>
                        <div className="field-val"><Phone size={14} /> {distilledData.profile.contact_info}</div>
                      </div>
                      <div className="review-field">
                        <label>HYPERLINKS</label>
                        <div className="field-val"><ExternalLink size={14} /> {distilledData.profile.hyperlinks}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="supply-list">
                    {distilledData.supplies.map((item, idx) => (
                      <div key={idx} className="supply-item">
                        <div className="check-box"><Check size={14} /></div>
                        <div className="supply-icon"><Briefcase size={14} /></div>
                        <div className="supply-text">{item}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="action-row">
                  <button type="button" className="back-btn" onClick={() => setStep(2)}>Back</button>
                  <button type="button" className="submit-btn" disabled={loading} onClick={handleFinish}>
                    {loading ? <Loader2 size={18} className="spin" /> : 'Confirm & Finish'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
