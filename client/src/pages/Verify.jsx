import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MODEL_URL = '/models';

export default function Verify() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [selfie, setSelfie] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null); // { gender, confidence, passed }
  const webcamRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = window.faceapi;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setModelsLoaded(true);
      }
    };
    loadModels();
  }, []);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setSelfie(imageSrc);
    setDetectionResult(null);
  };

  const detectGender = async (imageSrc) => {
    setDetecting(true);
    try {
      const faceapi = window.faceapi;
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withAgeAndGender();

      if (!detection) {
        setDetectionResult({ passed: false, reason: 'No face detected. Please retake your selfie in good lighting.' });
        setDetecting(false);
        return false;
      }

      const detectedGender = detection.gender; // 'male' or 'female'
      const confidence = Math.round(detection.genderProbability * 100);
      const expectedGender = user?.gender; // 'male' or 'female'
      const passed = detectedGender === expectedGender && confidence >= 60;

      setDetectionResult({ detectedGender, confidence, passed, expectedGender });
      setDetecting(false);
      return passed;
    } catch (err) {
      console.error('Gender detection error:', err);
      setDetecting(false);
      // If detection fails entirely, allow proceeding (server will validate)
      return true;
    }
  };

  const handleContinue = async () => {
    const passed = await detectGender(selfie);
    if (!passed) return; // detectionResult state already set with reason
    if (user?.gender === 'male') {
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (selfie) formData.append('selfie', dataURLtoFile(selfie, 'selfie.jpg'));
      if (document) formData.append('document', document);
      if (detectionResult) {
        formData.append('client_detected_gender', detectionResult.detectedGender || '');
        formData.append('client_gender_confidence', detectionResult.confidence || 0);
      }

      const res = await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newStatus = res.data.status || 'pending';
      if (newStatus === 'approved') {
        toast.success(res.data.message || 'Verified instantly!');
        updateUser({ ...user, verification_status: 'verified' });
      } else if (newStatus === 'rejected') {
        toast.error(res.data.message || 'Verification failed.');
        updateUser({ ...user, verification_status: 'rejected' });
      } else {
        toast.success(res.data.message || 'Verification submitted');
        updateUser({ ...user, verification_status: 'pending' });
        setStep(4);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit');
    }
    setLoading(false);
  };

  if (user?.verification_status === 'verified') {
    window.location.href = '/profile';
    return null;
  }

  const isFemale = user?.gender === 'female';

  return (
    <div className="container py-5 mt-5">
      <div className="card shadow border-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-body p-5 text-center">
          <h2 className="mb-4">Verify Your Profile</h2>

          {user?.verification_status === 'under_review' ? (
            <div>
              <div className="spinner-border text-danger mb-3"></div>
              <h4>Under Review</h4>
              <p>Our team is verifying your profile. This usually takes 5–10 minutes.</p>
              <button className="btn btn-outline-danger mt-3" onClick={() => window.location.reload()}>
                Refresh Status
              </button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div>
                  <p>To keep SWAY safe and exclusive, all members must be verified.</p>
                  <p>{isFemale ? 'You just need to take a quick selfie.' : 'You need a selfie and a government ID.'}</p>
                  {!modelsLoaded && (
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3 text-muted small">
                      <div className="spinner-border spinner-border-sm text-danger" />
                      Loading AI gender detection...
                    </div>
                  )}
                  <button className="btn btn-wine w-100" onClick={() => setStep(2)} disabled={!modelsLoaded}>
                    {modelsLoaded ? 'Start Verification' : 'Loading AI...'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h4>Take a Selfie</h4>
                  <p className="text-muted small mb-3">
                    Our AI will verify you are {isFemale ? 'female' : 'male'} before proceeding.
                  </p>
                  {!selfie ? (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-100 rounded mb-3"
                        videoConstraints={{ facingMode: 'user' }}
                      />
                      <button className="btn btn-wine w-100" onClick={capture}>
                        Capture Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <img src={selfie} alt="selfie" className="w-100 rounded mb-3" ref={imgRef} />

                      {detectionResult && !detectionResult.passed && (
                        <div className="alert alert-danger text-start mb-3">
                          <i className="bi bi-x-circle-fill me-2"></i>
                          {detectionResult.reason || (
                            <>
                              Gender mismatch detected. Our AI detected a{' '}
                              <strong>{detectionResult.detectedGender}</strong> face (
                              {detectionResult.confidence}% confidence), but your account is registered as{' '}
                              <strong>{detectionResult.expectedGender}</strong>. Please use your own photo.
                            </>
                          )}
                        </div>
                      )}

                      {detectionResult?.passed && (
                        <div className="alert alert-success text-start mb-3">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          Gender verified: <strong>{detectionResult.detectedGender}</strong> ({detectionResult.confidence}% confidence)
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary w-50"
                          onClick={() => { setSelfie(null); setDetectionResult(null); }}
                          disabled={detecting || loading}
                        >
                          Retake
                        </button>
                        <button
                          className="btn btn-wine w-50"
                          onClick={handleContinue}
                          disabled={detecting || loading || (detectionResult && !detectionResult.passed)}
                        >
                          {detecting ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Analyzing...</>
                          ) : loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                          ) : (
                            'Continue'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && !isFemale && (
                <div>
                  <h4>Upload ID Document</h4>
                  <p className="text-muted small">Upload a government-issued photo ID (Aadhaar, Passport, Driving License)</p>
                  <input
                    type="file"
                    className="form-control mb-4 mt-3"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocument(e.target.files[0])}
                  />
                  <button
                    className="btn btn-wine w-100"
                    onClick={handleSubmit}
                    disabled={!document || loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                    ) : (
                      'Submit Verification'
                    )}
                  </button>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="text-success fs-1 mb-3"><i className="bi bi-check-circle-fill" /></div>
                  <h4>Submitted!</h4>
                  <p>Your verification is under review. We'll notify you within 24 hours.</p>
                  <a href="/profile" className="btn btn-wine mt-2">Back to Profile</a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
