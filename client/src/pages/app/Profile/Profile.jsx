import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import RightBar from '../../../components/RightBar'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import './Profile.css'

const PERSONALITY_TRAITS = ['Active / Lively','Cheerful','Honest / Frank','Modest','Relaxed / Casual','Shy','Ambitious','Cultivated','Imaginative','Moody','Reliable','Sociable','Calm','Fun','Independent','Open-minded','Self-confident','Sophisticated','Chatty','Generous','Mature','Outgoing','Sensitive','Spiritual']
const SEXUAL_PRACTICES   = ['Anything goes','Conventional sex only','Reading erotic literature','Threesome','Blind folded','Costumes','Role playing','Using toys','Dominated','Dominating','Romantic sex','Watching erotic movies','Being watched','Private','Unusual places','Willing to experiment']
const HOBBIES            = ['Arts and crafts','Cooking','Hiking','Book clubs','Dining out','Movies','Charity','Fishing','Museums','Coffee','Gardening','Music']
const EXPECTATIONS       = ['Being listened to','Discretion / Secrecy','Just a flirt','No particular expectations','Platonic','Short-term','Chatting','Experience sharing','Learning / Exchanging','No strings attached','Playful','Something serious','Companionship','Friendship','Long','One-night-stand','Purely sexual','Soulmate','Complicity','Homosexual / Bisexual','Loving','Passion','Romantic','Taking things slow']
const RELATIONSHIP_TYPES = [{label:'Anything Exciting',icon:'bi-heart'},{label:'Long Term',icon:'bi-stopwatch'},{label:'Open to Anything',icon:'bi-people'},{label:'Short Term',icon:'bi-clock'},{label:'Undecided',icon:'bi-question-circle'},{label:'Virtual',icon:'bi-badge-vr'}]

const getFallback = (gender) => gender === 'female' ? '/img/girl.png' : '/img/profile.jpg'

const getPhoto = (p, gender) => {
  if (!p) return getFallback(gender)
  return p.startsWith('http') || p.startsWith('/') || p.startsWith('data:') ? p : `/${p}`
}

const formatDateInput = (val) => {
  if (!val) return ''
  try {
    return new Date(val).toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const profilePhotoRef = useRef(null)
  const privatePhotoRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const verifiedGender = (user?.verified_gender || user?.gender || 'male').toLowerCase()
  const isFemale = verifiedGender === 'female'

  const [form, setForm] = useState({
    nickname: user?.nickname || user?.username || '',
    date_of_birth: formatDateInput(user?.date_of_birth),
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || 'India',
    bio: user?.bio || '',
    marital_status: 'Single',
    children: 'No',
    profession: '',
    height: '',
    body_type: '',
    ethnicity: '',
    smoker: 'No',
    phone: user?.phone || '',
    instagram: user?.instagram || '',
    facebook: user?.facebook || '',
    telegram: user?.telegram || '',
    looking_for: [],
    personality_traits: [],
    sexual_practices: [],
    hobbies: [],
    relationship_expectations: []
  })
  const [privatePhotos, setPrivatePhotos] = useState([])

  useEffect(() => {
    if (!user?.id) return
    api.get(`/users/${user.id}`).then(res => {
      const u = res.data.user || res.data
      setForm({
        nickname:                  u.nickname || u.username || '',
        date_of_birth:             formatDateInput(u.date_of_birth),
        city:                      u.city || '',
        state:                     u.state || '',
        country:                   u.country || 'India',
        bio:                       u.bio || '',
        marital_status:            u.marital_status || 'Single',
        children:                  u.children || 'No',
        profession:                u.profession || '',
        height:                    u.height || '',
        body_type:                 u.body_type || '',
        ethnicity:                 u.ethnicity || '',
        smoker:                    u.smoker || 'No',
        phone:                     u.phone || '',
        instagram:                 u.instagram || '',
        facebook:                  u.facebook || '',
        telegram:                  u.telegram || '',
        looking_for:               Array.isArray(u.looking_for) ? u.looking_for : (u.looking_for ? u.looking_for.split(',').filter(Boolean) : []),
        personality_traits:        Array.isArray(u.personality_traits) ? u.personality_traits : [],
        sexual_practices:          Array.isArray(u.sexual_practices) ? u.sexual_practices : [],
        hobbies:                   Array.isArray(u.hobbies) ? u.hobbies : [],
        relationship_expectations: Array.isArray(u.relationship_expectations) ? u.relationship_expectations : [],
      })
    }).catch(() => {})

    api.get('/private-photos').then(res => {
      if (res.data.success) setPrivatePhotos(res.data.photos || [])
    }).catch(() => {})
  }, [user?.id])

  const handleProfilePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    fd.append('is_primary', 'true')
    try {
      const res = await api.post('/users/profile/photo', fd)
      const photoUrl = res.data?.photo_url || res.data?.photoUrl || res.data?.photo?.photo_url
      if (photoUrl) {
        updateUser({ profile_photo: photoUrl })
        toast.success('Profile photo updated')
      }
    } catch { toast.error('Upload failed') }
  }

  const handlePrivatePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      const res = await api.post('/private-photos/upload', fd)
      if (res.data.success && res.data.photo) {
        setPrivatePhotos(p => [res.data.photo, ...p])
        toast.success('Private photo uploaded')
      }
    } catch { toast.error('Upload failed') }
  }

  const handleDeletePrivatePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return
    try {
      await api.delete(`/private-photos/${photoId}`)
      setPrivatePhotos(p => p.filter(photo => photo.id !== photoId))
      toast.success('Photo removed')
    } catch { toast.error('Failed to delete photo') }
  }

  const toggle = (field, value) => setForm(p => {
    const arr = Array.isArray(p[field]) ? p[field] : []
    return { ...p, [field]: arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value] }
  })

  // Calculate live profile completion percentage
  const requiredChecks = [
    Boolean(user?.profile_photo),
    Boolean(form.nickname?.trim()),
    Boolean(form.date_of_birth),
    Boolean(form.city?.trim()),
    Boolean(form.bio?.trim()),
    Boolean((form.looking_for?.length || 0) > 0 || (form.hobbies?.length || 0) > 0),
  ]
  const completedCount = requiredChecks.filter(Boolean).length
  const completionPercent = Math.round((completedCount / requiredChecks.length) * 100)

  const save = async (e) => {
    e.preventDefault()

    if (!user?.profile_photo) {
      toast.error('Please upload a profile photo to complete your profile.')
      return
    }
    if (!form.nickname?.trim()) {
      toast.error('Full Name / Nickname is required.')
      return
    }
    if (!form.date_of_birth) {
      toast.error('Date of Birth is required.')
      return
    }
    if (!form.city?.trim()) {
      toast.error('City / Location is required.')
      return
    }
    if (!form.bio?.trim()) {
      toast.error('Bio / About Me introduction is required.')
      return
    }
    if ((form.looking_for?.length || 0) === 0 && (form.hobbies?.length || 0) === 0) {
      toast.error('Please select at least one Relationship Sought or Hobby.')
      return
    }

    setSaving(true)
    try {
      const res = await api.put('/users/profile', {
        ...form,
        looking_for: form.looking_for.join(','),
      })
      const updatedProfile = res.data?.profile || {}
      updateUser({
        ...updatedProfile,
        nickname: form.nickname,
        city: form.city,
        state: form.state,
        country: form.country,
        bio: form.bio,
        profile_completed: true,
        onboarding_status: 'PROFILE_COMPLETED',
      })

      const targetGender = (updatedProfile.verified_gender || verifiedGender).toLowerCase()
      if (targetGender === 'female') {
        toast.success('Profile completed! Welcome to Sway — Opening Home Discovery.')
      } else {
        toast.success('Profile completed! Welcome to Sway — Opening Home Discovery.')
      }
      navigate(res.data?.next_route || '/home')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const Checkboxes = ({ field, options }) => (
    <div className="row">
      {[0,1,2,3].map(col => (
        <div className="col-md-3 col-sm-6" key={col}>
          {options.filter((_, i) => i % 4 === col).map(opt => (
            <div className="form-check" key={opt}>
              <input className="form-check-input" type="checkbox"
                checked={(form[field] || []).includes(opt)} onChange={() => toggle(field, opt)} />
              <label className="form-check-label">{opt}</label>
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="row g-3">
        <div className="col-12 col-xl-9">
          {/* Onboarding & AI Verification Status Banner */}
          <div className="card-box mb-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #ffffff 100%)', borderLeft: '4px solid #8f0505' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1">
                    <i className="bi bi-patch-check-fill me-1" />
                    Verified profile
                  </span>
                  {isFemale ? (
                    <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1">
                      <i className="bi bi-gift-fill me-1" /> Free Chat Unlocked
                    </span>
                  ) : (
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">
                      <i className="bi bi-lightning-charge-fill me-1" /> Connect-Based Chat
                    </span>
                  )}
                </div>
                <h5 className="fw-bold mb-1">
                  {user?.profile_completed ? 'Manage Your Profile' : 'Complete Your Profile Setup'}
                </h5>
                <p className="text-muted small mb-0">
                  Fill in all required fields (*) and click Save Profile to open Home / Discovery.
                </p>
              </div>
              <div className="text-end" style={{ minWidth: 160 }}>
                <div className="d-flex justify-content-between small fw-semibold mb-1">
                  <span>Completion</span>
                  <span className="text-danger">{completionPercent}%</span>
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${completionPercent}%` }}
                    aria-valuenow={completionPercent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={save} className="row g-3 g-md-4">

            {/* Profile Photos */}
            <div className="col-12 col-md-4">
              <div className="action-card h-100" style={{ cursor: 'pointer' }} onClick={() => profilePhotoRef.current?.click()}>
                <div className="action-item">
                  <div className="profile_div">
                    <img
                      src={getPhoto(user?.profile_photo, verifiedGender)}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(verifiedGender); }}
                      className="profile_img"
                      alt="profile"
                    />
                    <i className="bi bi-camera" />
                    <input type="file" ref={profilePhotoRef} onChange={handleProfilePhoto} style={{ display: 'none' }} accept="image/*" />
                  </div>
                  <div className="pt-3">
                    <b>Profile Photo <span className="text-danger">*</span></b>
                    <div className="small text-muted">Click to change photo</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-8">
              <div className="action-card h-100">
                <div className="row g-3">
                  <div className="col-12 col-sm-5">
                    <div className="action-item h-100" style={{ cursor: 'pointer' }} onClick={() => privatePhotoRef.current?.click()}>
                      <div className="action-icon"><i className="bi bi-camera" /></div>
                      <div className="pt-2"><b>Private Photos</b><br /><small className="text-muted">Encrypted for your security.</small></div>
                      <input type="file" ref={privatePhotoRef} onChange={handlePrivatePhoto} style={{ display: 'none' }} accept="image/*" />
                    </div>
                  </div>
                  <div className="col-12 col-sm-7">
                    <div className="upload_photos">
                      {privatePhotos.length > 0
                        ? privatePhotos.map(p => (
                            <div className="private-photo-item" key={p.id}>
                              <img
                                src={getPhoto(p.photo_url, verifiedGender)}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallback(verifiedGender); }}
                                alt="private"
                              />
                              <button
                                type="button"
                                className="private-photo-del"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePrivatePhoto(p.id);
                                }}
                                title="Delete photo"
                                aria-label="Delete photo"
                              >
                                &times;
                              </button>
                            </div>
                          ))
                        : <div className="text-muted small d-flex align-items-center justify-content-center w-100 py-4">No private photos yet</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="col-12">
              <div className="card-box">
                <h5 className="fw-bold mb-3">
                  <i className="bi bi-card-text text-danger me-2" />
                  Introduction / Bio <span className="text-danger">*</span>
                </h5>
                <textarea
                  className="form-control bg-light"
                  rows="5"
                  placeholder="Tell everyone about yourself, your interests, and what makes you unique..."
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Personal Info */}
            <div className="col-lg-6">
              <div className="card-box h-100">
                <h5 className="fw-bold mb-4"><i className="bi bi-person text-danger me-2" />Personal Information</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name / Nickname <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your display name"
                      value={form.nickname}
                      onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">
                      Gender <span className="badge bg-success-subtle text-success ms-1">AI Verified</span>
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fw-semibold"
                      value={isFemale ? 'Female (Verified)' : 'Male (Verified)'}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Date of Birth <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date_of_birth}
                      onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">City / Location <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">State / Province</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Maharashtra"
                      value={form.state}
                      onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. India"
                      value={form.country}
                      onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Marital Status</label>
                    <select className="form-select" value={form.marital_status} onChange={e => setForm(p => ({ ...p, marital_status: e.target.value }))}>
                      {['Single','Married','Divorced','Widowed','Separated'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Occupation</label>
                    <select className="form-select" value={form.profession} onChange={e => setForm(p => ({ ...p, profession: e.target.value }))}>
                      <option value="">Select...</option>
                      {['Student','Software/IT','Business/Management','Healthcare/Medical','Education/Teaching','Arts/Entertainment','Finance/Accounting','Engineering','Legal','Entrepreneur/Founder','Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Relationship Type */}
            <div className="col-lg-6">
              <div className="card-box h-100">
                <h5 className="fw-bold mb-4">
                  <i className="bi bi-heart text-danger me-2" />
                  Relationship Sought <span className="text-danger">*</span>
                </h5>
                <div className="row g-3">
                  {RELATIONSHIP_TYPES.map(rel => {
                    const active = (form.looking_for || []).includes(rel.label)
                    return (
                      <div className="col-6" key={rel.label} onClick={() => toggle('looking_for', rel.label)}>
                        <div className={`relation-box ${active ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                          <i className={`bi ${rel.icon} fs-3`} />
                          <b>{rel.label}</b>
                          {active && <i className="bi bi-check-circle-fill check" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Social Links & Privacy-Controlled Contact Info */}
            <div className="col-12">
              <div className="card-box">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-share-fill text-danger me-2" />
                    Social Links & Contact Details
                  </h5>
                  {isFemale && (
                    <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                      <i className="bi bi-shield-lock-fill me-1" />
                      Hidden from all male users by default — grant access per user
                    </span>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold"><i className="bi bi-instagram text-danger me-1" />Instagram</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="@username"
                      value={form.instagram}
                      onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold"><i className="bi bi-facebook text-primary me-1" />Facebook</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="facebook.com/username"
                      value={form.facebook}
                      onChange={e => setForm(p => ({ ...p, facebook: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold"><i className="bi bi-telegram text-info me-1" />Telegram</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="@telegram_handle"
                      value={form.telegram}
                      onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold"><i className="bi bi-telephone-fill text-success me-1" />Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Physical */}
            <div className="col-12">
              <div className="card-box">
                <h5 className="fw-bold mb-4">Physical Information</h5>
                <div className="row g-4">
                  {[
                    { label: 'Height (cm)', field: 'height', type: 'number' },
                  ].map(({ label, field, type }) => (
                    <div className="col-md-3" key={field}>
                      <label>{label}</label>
                      <input className="form-control mt-2" type={type || 'text'}
                        value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                    </div>
                  ))}
                  {[
                    { label: 'Figure', field: 'body_type', opts: ['Athletic','Average','Curvy','Slim'] },
                    { label: 'Ethnicity', field: 'ethnicity', opts: ['Asian','Black','Hispanic','White','Other'] },
                    { label: 'Smoker', field: 'smoker', opts: ['No','Yes','Occasionally'] },
                  ].map(({ label, field, opts }) => (
                    <div className="col-md-3" key={field}>
                      <label>{label}</label>
                      <select className="form-select mt-2" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}>
                        <option value="">Select...</option>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="col-12">
              <div className="card-box">
                <h5 className="fw-bold mb-4">My Personal Information & Interests</h5>
                {[
                  { title: 'My personality',    field: 'personality_traits',        opts: PERSONALITY_TRAITS },
                  { title: 'Sexual practices',  field: 'sexual_practices',          opts: SEXUAL_PRACTICES },
                  { title: 'My hobbies *',      field: 'hobbies',                   opts: HOBBIES },
                  { title: 'I am looking for',  field: 'relationship_expectations', opts: EXPECTATIONS },
                ].map(({ title, field, opts }, i, arr) => (
                  <div key={field}>
                    <div className="preference-group mb-4">
                      <h5 className="mb-3">{title}</h5>
                      <Checkboxes field={field} options={opts} />
                    </div>
                    {i < arr.length - 1 && <hr />}
                  </div>
                ))}
                <div className="mt-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="small text-muted">
                    <i className="bi bi-info-circle me-1" />
                    Saving your completed profile will open Home / Discovery with opposite-gender profiles.
                  </div>
                  <button type="submit" className="btn-red px-5 py-3 fw-bold" disabled={saving}>
                    {saving ? 'Saving Profile...' : 'Save Profile & Open Home'}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="col-12 col-xl-3">
          <RightBar />
        </div>
      </div>
    </DashboardLayout>
  )
}

