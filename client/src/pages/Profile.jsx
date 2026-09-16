import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PERSONALITY_TRAITS = ["Active / Lively", "Cheerful", "Honest / Frank", "Modest", "Relaxed / Casual", "Shy", "Ambitious", "Cultivated", "Imaginative", "Moody", "Reliable", "Sociable", "Calm", "Fun", "Independent", "Open-minded", "Self-confident", "Sophisticated", "Chatty", "Generous", "Mature", "Outgoing", "Sensitive", "Spiritual"];
const SEXUAL_PRACTICES = ["Anything goes", "Conventional sex only", "Reading erotic literature", "Threesome", "Blind folded", "Costumes", "Role playing", "Using toys", "Dominated", "Dominating", "Romantic sex", "Watching erotic movies", "Being watched", "Private", "Unusual places", "Willing to experiment"];
const HOBBIES = ["Arts and crafts", "Cooking", "Hiking", "Book clubs", "Dining out", "Movies", "Charity", "Fishing", "Museums", "Coffee", "Gardening", "Music"];
const EXPECTATIONS = ["Being listened to", "Discretion / Secrecy", "Just a flirt", "No particular expectations", "Platonic", "Short-term", "Chatting", "Experience sharing", "Learning / Exchanging", "No strings attached", "Playful", "Something serious", "Companionship", "Friendship", "Long", "One-night-stand", "Purely sexual", "Soulmate", "Complicity", "Homosexual / Bisexual", "Loving", "Passion", "Romantic", "Taking things slow"];
const RELATIONSHIP_TYPES = [{label:"Anything Exciting", icon:"bi-heart"}, {label:"Long Term", icon:"bi-stopwatch"}, {label:"Open to Anything", icon:"bi-people"}, {label:"Short Term", icon:"bi-clock"}, {label:"Undecided", icon:"bi-question-circle"}, {label:"Virtual", icon:"bi-badge-vr"}];

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    gender: 'Straight', marital_status: 'Single', children: 'No', profession: 'Consultant',
    height: '177', body_type: '', ethnicity: '', smoker: 'No',
    looking_for: [], personality_traits: [], sexual_practices: [], hobbies: [], relationship_expectations: []
  });

  const [conversations, setConversations] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [privatePhotos, setPrivatePhotos] = useState([]);

  const profilePhotoRef = useRef(null);
  const privatePhotoRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${user.id}`);
        const u = res.data.user;
        setFormData({
          gender: u.gender || 'Straight',
          marital_status: u.marital_status || 'Single',
          children: u.children || 'No',
          profession: u.profession || '',
          height: u.height || '177',
          body_type: u.body_type || '',
          ethnicity: u.ethnicity || '',
          smoker: u.smoker || 'No',
          looking_for: (u.looking_for && typeof u.looking_for === 'string') ? u.looking_for.split(',') : (u.looking_for || []),
          personality_traits: u.personality_traits || [],
          sexual_practices: u.sexual_practices || [],
          hobbies: u.hobbies || [],
          relationship_expectations: u.relationship_expectations || []
        });
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchRealtime = async () => {
      try {
        const [convRes, visRes, photoRes] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/visitors'),
          api.get('/private-photos')
        ]);
        if(convRes.data.success) setConversations(convRes.data.conversations);
        if(visRes.data.success) setVisitors(visRes.data.visitors);
        if(photoRes.data.success) setPrivatePhotos(photoRes.data.photos);
      } catch (err) {
        console.error('Realtime fetch error', err);
      }
    };

    if (user?.id) {
      fetchProfile();
      fetchRealtime();
    }
  }, [user]);

  const handleProfilePhoto = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.post('/users/profile/photo', fd);
      if(res.data.success) {
        updateUser({...user, profile_photo: res.data.photo_url});
        toast.success('Profile photo updated');
      }
    } catch(err) { toast.error('Upload failed'); }
  };

  const handlePrivatePhoto = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.post('/private-photos/upload', fd);
      if(res.data.success) {
        setPrivatePhotos([res.data.photo, ...privatePhotos]);
        toast.success('Private photo uploaded');
      }
    } catch(err) { toast.error('Upload failed'); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, looking_for: formData.looking_for.join(',') };
      await api.put('/users/profile', payload);
      toast.success('Profile saved successfully');
    } catch(e) { 
      toast.error('Failed to update profile'); 
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => {
      const arr = Array.isArray(prev[field]) ? prev[field] : [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const renderCheckboxes = (field, options, cols = 4) => {
    const chunkSize = Math.ceil(options.length / cols);
    const chunks = [];
    for (let i = 0; i < options.length; i += chunkSize) {
      chunks.push(options.slice(i, i + chunkSize));
    }
    
    return (
      <div className="row">
        {chunks.map((colOpts, i) => (
          <div className={`col-md-${12/cols} col-sm-6 col-12`} key={i}>
            {colOpts.map(opt => (
              <div className="form-check" key={opt}>
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  checked={(formData[field] || []).includes(opt)} 
                  onChange={() => handleArrayToggle(field, opt)} 
                />
                <label className="form-check-label">{opt}</label>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <section className="content">
        <div className="row g-3">
          <div className="col-12 col-lg-9">
            <form onSubmit={save} className="row g-3">

              {/* Photos Section */}
              <div className="col-lg-3">
                <div className="action-card h-100" style={{cursor: 'pointer'}} onClick={() => profilePhotoRef.current?.click()}> 
                  <div className="action-item">
                    <div className="profile_div">
                      <img src={user?.profile_photo ? `http://localhost:5000${user.profile_photo}` : '/img/profile.jpg'} className="profile_img" alt="profile" style={{objectFit: 'cover'}} />
                      <i className="bi bi-camera"></i>
                      <input type="file" ref={profilePhotoRef} onChange={handleProfilePhoto} style={{display: 'none'}} accept="image/*" />
                    </div>
                    <div className="pt-3"><b>Upload Profile Photos</b></div>
                  </div>               
                </div>
              </div> 
              <div className="col-lg-9">
                <div className="action-card h-100">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="action-item" style={{cursor: 'pointer'}} onClick={() => privatePhotoRef.current?.click()}>
                        <div className="action-icon"><i className="bi bi-camera"></i></div>
                        <div className="pt-3"><b>Upload Private Photos</b><br/><small>This picture will be encrypted for your security.</small></div>
                        <input type="file" ref={privatePhotoRef} onChange={handlePrivatePhoto} style={{display: 'none'}} accept="image/*" />
                      </div>
                    </div>
                    <div className="col-md-8"> 
                      <div className="upload_photos"> 
                        {privatePhotos.length > 0 ? (
                          privatePhotos.map(p => (
                            <img key={p.id} src={`http://localhost:5000${p.photo_url}`} alt="private" style={{objectFit: 'cover'}} />
                          ))
                        ) : (
                          <div className="text-muted w-100 h-100 d-flex align-items-center justify-content-center">
                            <small>No private photos uploaded</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Introduction */}
              <div className="col-12">
                <div className="card-box">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-card-text text-danger me-2"></i> Introduction Paragraph
                  </h5>
                  <textarea 
                    className="form-control bg-light" 
                    rows="8" 
                    placeholder="Tell everyone a little bit about yourself..."
                    value={formData.bio || ''}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {/* Personal Info */}
              <div className="col-lg-6">
                <div className="card-box h-100">
                  <h5 className="fw-bold mb-4">
                    <i className="bi bi-person text-danger me-2"></i> Personal Information
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small">Gender</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control bg-light" 
                          value={user?.gender === 'female' ? 'Female' : 'Male'} 
                          readOnly 
                        />
                        {user?.verification_status === 'verified' && (
                          <span className="input-group-text bg-light text-success" title="Verified by AI">
                            <i className="bi bi-patch-check-fill"></i>
                          </span>
                        )}
                      </div>
                      <small className="text-muted" style={{fontSize: '11px'}}>
                        Verified during registration
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Marital Status</label>
                      <select className="form-select" value={formData.marital_status} onChange={e=>setFormData({...formData, marital_status: e.target.value})}>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Divorced</option>
                        <option>Widowed</option>
                        <option>Separated</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Children</label>
                      <select className="form-select" value={formData.children} onChange={e=>setFormData({...formData, children: e.target.value})}>
                        <option>No</option>
                        <option>Yes</option>
                        <option>Someday</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Occupation</label>
                      <select 
                        className="form-select" 
                        value={formData.profession || ''} 
                        onChange={e => setFormData({...formData, profession: e.target.value})}
                      >
                        <option value="">Select Occupation...</option>
                        <option value="Student">Student</option>
                        <option value="Software/IT">Software / IT</option>
                        <option value="Business/Management">Business / Management</option>
                        <option value="Healthcare/Medical">Healthcare / Medical</option>
                        <option value="Education/Teaching">Education / Teaching</option>
                        <option value="Arts/Entertainment">Arts / Entertainment</option>
                        <option value="Finance/Accounting">Finance / Accounting</option>
                        <option value="Sales/Marketing">Sales / Marketing</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Legal">Legal</option>
                        <option value="Entrepreneur/Founder">Entrepreneur / Founder</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type of Relationship Sought */}
              <div className="col-lg-6">
                <div className="card-box h-100">
                  <h5 className="fw-bold mb-4">
                    <i className="bi bi-heart text-danger me-2"></i> Type of Relationship Sought
                  </h5>
                  <div className="row g-3">
                    {RELATIONSHIP_TYPES.map(rel => {
                      const isActive = (formData.looking_for || []).includes(rel.label);
                      return (
                        <div className="col-12 col-sm-6" key={rel.label} onClick={() => handleArrayToggle('looking_for', rel.label)}>
                          <div className={`relation-box ${isActive ? 'active' : ''}`} style={{cursor:'pointer'}}>
                            <i className={`bi ${rel.icon} fs-3`}></i>
                            <b>{rel.label}</b>
                            {isActive && <i className="bi bi-check-circle-fill check"></i>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Physical Info */}
              <div className="col-12">
                <div className="card-box">
                  <h5 className="fw-bold mb-4">
                    <i className="bi bi-person-fill me-2"></i> PHYSICAL INFORMATION
                  </h5>
                  <div className="row g-4">
                    <div className="col-md-3">
                      <label>Height (cm) :</label>
                      <input className="form-control mt-2" type="number" value={formData.height} onChange={e=>setFormData({...formData, height: e.target.value})} />
                    </div>
                    <div className="col-md-3">
                      <label>Figure :</label>
                      <select className="form-select mt-2" value={formData.body_type} onChange={e=>setFormData({...formData, body_type: e.target.value})}>
                        <option value="">Select...</option>
                        <option>Athletic</option>
                        <option>Average</option>
                        <option>Curvy</option>
                        <option>Slim</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label>Ethnicity :</label>
                      <select className="form-select mt-2" value={formData.ethnicity} onChange={e=>setFormData({...formData, ethnicity: e.target.value})}>
                        <option value="">Select...</option>
                        <option>Asian</option>
                        <option>Black</option>
                        <option>Hispanic</option>
                        <option>White</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label>Smoker :</label>
                      <select className="form-select mt-2" value={formData.smoker} onChange={e=>setFormData({...formData, smoker: e.target.value})}>
                        <option>No</option>
                        <option>Yes</option>
                        <option>Occasionally</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Grids */}
              <div className="col-12">
                <div className="card-box">
                  <h5 className="fw-bold mb-4"><i className="bi bi-person-fill me-2"></i> MY PERSONAL INFORMATION</h5>
                  
                  <div className="preference-group mb-4">
                    <h5 className="mb-3">My personality</h5>
                    {renderCheckboxes('personality_traits', PERSONALITY_TRAITS)}
                  </div>
                  <hr />
                  
                  <div className="preference-group mb-4">
                    <h5 className="mb-3">Sexual practices</h5>
                    {renderCheckboxes('sexual_practices', SEXUAL_PRACTICES)}
                  </div>
                  <hr />

                  <div className="preference-group mb-4">
                    <h5 className="mb-3">My hobbies</h5>
                    {renderCheckboxes('hobbies', HOBBIES)}
                  </div>
                  <hr />

                  <div className="preference-group mb-4">
                    <h5 className="mb-3">I am looking for</h5>
                    {renderCheckboxes('relationship_expectations', EXPECTATIONS)}
                  </div>
                  <hr />

                  <div className="sticky-save">
                    <button type="submit" className="btn-red">Save</button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Sidebar */}
          <div className="col-12 col-lg-3">
            <div className="rightbar mb-4">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold">Active Conversations</h6> 
              </div>
              <div className="scrool_right">
                {conversations.length > 0 ? conversations.map(c => (
                  <div className="user-row" key={c.conversation_id}>
                    {c.other_photo ? (
                       <img src={`http://localhost:5000${c.other_photo}`} className="avatar rounded-circle" alt="avatar" style={{objectFit: 'cover'}} />
                    ) : (
                       <div className="avatar bg-secondary rounded-circle"></div>
                    )}
                    <div>
                      <b>{c.other_username}</b><br/>
                      {c.other_is_online ? (
                        <small><span className="small-dot bg-success"></span> Online</small>
                      ) : (
                        <small>Offline</small>
                      )}
                    </div>
                    {c.unread_count > 0 && <span className="badge-dot">{c.unread_count}</span>}
                  </div>
                )) : (
                  <div className="text-muted small">No active chats</div>
                )}
              </div>
            </div>

            <div className="rightbar mb-4">
              <div className="d-flex justify-content-between mb-2">
                <h6 className="fw-bold">Who Viewed You</h6>
                {visitors.length > 0 && <a href="/visitors" className="text-danger small text-decoration-none">See All</a>}
              </div>
              <div className="d-flex flex-wrap gap-1">
                {visitors.slice(0, 4).map(v => (
                  <img 
                    key={v.visitor_id} 
                    src={v.profile_photo ? `http://localhost:5000${v.profile_photo}` : '/img/profile.jpg'} 
                    className="profile-img d-inline-block rounded-circle" 
                    style={{width:40, height:40, objectFit: 'cover'}} 
                    alt="visitor" 
                  />
                ))}
                {visitors.length > 4 && (
                  <span className="profile-img bg-light text-dark text-center d-flex align-items-center justify-content-center rounded-circle" style={{width:40, height:40, fontSize: '0.8rem'}}>
                    +{visitors.length - 4}
                  </span>
                )}
                {visitors.length === 0 && <span className="text-muted small">No visitors yet</span>}
              </div>
            </div>
          </div>

        </div>
      </section>
    </DashboardLayout>
  );
}