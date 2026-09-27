import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import './Verify.css';

const MODEL_URL = '/models';

export default function Verify() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const selectedGender = (
    user?.selected_gender ||
    user?.gender ||
    sessionStorage.getItem('sway_selected_gender') ||
    'female'
  ).toLowerCase();

  const [cameraError, setCameraError] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [selfie, setSelfie] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verificationState, setVerificationState] = useState(
    user?.onboarding_status === 'VERIFICATION_RESUBMISSION_REQUIRED'
      ? 'VERIFICATION_RESUBMISSION_REQUIRED'
      : 'NOT_VERIFIED'
  );
  const [scanStepText, setScanStepText] = useState('');
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [failModal, setFailModal] = useState({ open: false, reason: '', isGenderMismatch: false });
  const [attemptCount, setAttemptCount] = useState(0);

  const webcamRef = useRef(null);

  // Load face-api models from /models
  useEffect(() => {
    let mounted = true;
    const loadModels = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) {
          if (mounted) setModelsLoaded(true);
          return;
        }
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet?.loadFromUri(MODEL_URL).catch(() => {}),
          faceapi.nets.ssdMobilenetv1?.loadFromUri(MODEL_URL).catch(() => {}),
        ]);
        if (mounted) setModelsLoaded(true);
      } catch (err) {
        console.warn('Face-API model preload warning:', err);
        if (mounted) setModelsLoaded(true);
      }
    };
    loadModels();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      toast.error('Unable to capture frame from live camera. Please ensure camera permission is granted and try again.');
      return;
    }
    setSelfie(screenshot);
  }, []);

  const handleRetryCameraPermission = () => {
    setCameraError(false);
    setCameraKey((k) => k + 1);
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  // Run AI Face + Gender Detection on the live captured frame
  const analyzeLiveSelfieWithAI = async (imageSrc) => {
    const faceapi = window.faceapi;
    if (!faceapi) {
      return {
        face_detected: false,
        face_count: 0,
        failure_reason: 'AI verification engine is still initializing. Please wait a moment and retry.',
      };
    }

    try {
      setScanStepText('Detecting human face & checking visibility...');
      const img = await faceapi.fetchImage(imageSrc);

      if (!img.width || !img.height || img.width < 120 || img.height < 120) {
        return {
          face_detected: false,
          face_count: 0,
          failure_reason: 'Camera capture resolution is too low. Please ensure your camera is unobstructed and retry.',
        };
      }

      // Detect all faces in the live frame
      let detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 }))
        .withAgeAndGender();

      // Fallback to SSD MobileNet if TinyFaceDetector missed a valid face
      if ((!detections || detections.length === 0) && faceapi.nets.ssdMobilenetv1?.isLoaded) {
        detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
          .withAgeAndGender();
      }

      if (!detections || detections.length === 0) {
        return {
          face_detected: false,
          face_count: 0,
          failure_reason: 'No face detected. Please position your face inside the verification frame and look directly at the camera.',
        };
      }

      if (detections.length > 1) {
        return {
          face_detected: true,
          face_count: detections.length,
          failure_reason: `Multiple faces detected (${detections.length} faces found). Please ensure only your face is visible in the live camera frame.`,
        };
      }

      const single = detections[0];
      const faceScore = single.detection?.score || 0;
      const box = single.detection?.box;
      const faceWidthRatio = box ? box.width / img.width : 0.3;

      if (faceScore < 0.42 || faceWidthRatio < 0.08) {
        return {
          face_detected: true,
          face_count: 1,
          face_score: faceScore,
          failure_reason: 'Face is too far or partially hidden. Please move closer to the camera in good lighting and look directly at the camera.',
        };
      }

      setScanStepText('Detecting gender & comparing with registration selection...');
      const detectedGender = (single.gender || '').toLowerCase(); // 'female' or 'male'
      const confidence = Math.round((single.genderProbability || 0) * 100);

      if (!['female', 'male'].includes(detectedGender) || confidence < 55) {
        return {
          face_detected: true,
          face_count: 1,
          face_score: faceScore,
          detected_gender: detectedGender,
          confidence,
          failure_reason: `AI verification could not be completed with sufficient confidence (${confidence}%). Please ensure clear front lighting and retry live capture.`,
        };
      }

      return {
        face_detected: true,
        face_count: 1,
        face_score: faceScore,
        detected_gender: detectedGender,
        confidence,
        failure_reason: null,
      };
    } catch (err) {
      console.error('AI face detection error:', err);
      return {
        face_detected: false,
        face_count: 0,
        failure_reason: 'AI verification could not be completed on this camera frame. Please retry live capture.',
      };
    }
  };

  const handleVerifySelfie = async () => {
    if (!selfie || verificationState === 'VERIFICATION_IN_PROGRESS') return;

    setVerificationState('VERIFICATION_IN_PROGRESS');
    setScanStepText('Initializing live AI face & gender scan...');
    setAttemptCount((c) => c + 1);

    try {
      const aiAnalysis = await analyzeLiveSelfieWithAI(selfie);

      setScanStepText('Validating gender match with registration server...');
      const formData = new FormData();
      const blob = dataURLtoBlob(selfie);
      formData.append('photo', blob, 'live_selfie.jpg');
      formData.append('capture_source', 'live_camera');
      formData.append('face_detected', String(aiAnalysis.face_detected));
      formData.append('face_count', String(aiAnalysis.face_count ?? 0));
      if (aiAnalysis.face_score !== undefined) formData.append('face_score', String(aiAnalysis.face_score));
      if (aiAnalysis.detected_gender) formData.append('detected_gender', aiAnalysis.detected_gender);
      if (aiAnalysis.confidence !== undefined) formData.append('confidence', String(aiAnalysis.confidence));
      if (aiAnalysis.failure_reason) formData.append('failure_reason', aiAnalysis.failure_reason);

      const res = await api.post('/verification/selfie', formData);
      const data = res.data;

      if (data.verified && data.success && data.gender_match_status === 'MATCH') {
        setVerificationState('VERIFIED');
        setVerifiedResult({
          selectedGender: data.selected_gender || selectedGender,
          detectedGender: data.ai_detected_gender || data.detected_gender,
          confidence: data.confidence,
          connectRequired: data.connect_required_for_chat,
          message: data.message,
          user: data.user,
          token: data.token,
        });

        // Update AuthContext with verified user and token
        if (data.user && data.token) {
          login(data.user, data.token);
        }
        toast.success('Verification Successful! Gender matched.');

        // Redirect to Profile Page after brief confirmation
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 1600);
      } else {
        const isMismatch = data.code === 'GENDER_MISMATCH' || data.gender_match_status === 'MISMATCH';
        const reason = isMismatch
          ? "We couldn't verify your identity based on the information provided. Please complete the verification again using a live selfie."
          : (data.reason || data.message || aiAnalysis.failure_reason || "We couldn't verify your identity based on the information provided. Please complete the verification again using a live selfie.");

        setVerificationState('VERIFICATION_RESUBMISSION_REQUIRED');
        setFailModal({ open: true, reason, isGenderMismatch: isMismatch });
      }
    } catch (err) {
      const isMismatch = err.response?.data?.code === 'GENDER_MISMATCH' || err.response?.data?.gender_match_status === 'MISMATCH';
      const reason =
        err.response?.data?.reason ||
        err.response?.data?.message ||
        "We couldn't verify your identity based on the information provided. Please complete the verification again using a live selfie.";
      setVerificationState('VERIFICATION_RESUBMISSION_REQUIRED');
      setFailModal({ open: true, reason, isGenderMismatch: isMismatch });
    } finally {
      setScanStepText('');
    }
  };

  const handleRetryVerification = () => {
    setFailModal({ open: false, reason: '', isGenderMismatch: false });
    setSelfie(null);
    setVerificationState('VERIFICATION_RESUBMISSION_REQUIRED');
  };

  const isProcessing = verificationState === 'VERIFICATION_IN_PROGRESS';

  return (
    <div className="verify-page">
      <div className="verify-card">
        {/* Header & Onboarding Stepper */}
        <div className="verify-header">
          <div className="verify-stepper">
            <div className="verify-step done">
              <i className="bi bi-check-circle-fill" /> 1. Registered ({selectedGender === 'female' ? 'Female' : 'Male'})
            </div>
            <div className="verify-step active">
              <i className="bi bi-camera-video-fill" /> 2. Live Selfie Verification
            </div>
            <div className="verify-step">
              <i className="bi bi-person-vcard" /> 3. Profile Setup
            </div>
            <div className="verify-step">
              <i className="bi bi-stars" /> 4. Access Platform
            </div>
          </div>
          <h3 className="fw-bold mb-1">Live Selfie Verification</h3>
          <p className="mb-0 small opacity-75">
            Capture a live selfie using your device camera to verify your face and match your selected gender.
          </p>
        </div>

        <div className="verify-body text-center">
          {/* Selected Registration Gender Badge */}
          <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
            <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
              <i className={`bi ${selectedGender === 'female' ? 'bi-gender-female text-danger' : 'bi-gender-male text-primary'} me-1`} />
              Selected Registration Gender: <strong className="text-uppercase">{selectedGender}</strong>
            </span>
            <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">
              <i className="bi bi-camera-video-fill me-1" /> Live Camera Only
            </span>
          </div>

          {/* SUCCESS STATE */}
          {verificationState === 'VERIFIED' && verifiedResult ? (
            <div className="py-4">
              <div className="verify-success-icon">
                <i className="bi bi-patch-check-fill" />
              </div>
              <h4 className="fw-bold text-success mb-2">Verification Successful!</h4>
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
                style={{
                  background: verifiedResult.detectedGender === 'female' ? '#fdf2f7' : '#eef5ff',
                  color: verifiedResult.detectedGender === 'female' ? '#d63384' : '#0d6efd',
                  fontWeight: 700,
                }}
              >
                <i className={`bi ${verifiedResult.detectedGender === 'female' ? 'bi-gender-female' : 'bi-gender-male'}`} />
                Selected: {verifiedResult.selectedGender === 'female' ? 'Female' : 'Male'} • AI Detected: {verifiedResult.detectedGender === 'female' ? 'Female' : 'Male'} (MATCH)
              </div>

              <div className="alert alert-light border mx-auto mb-4" style={{ maxWidth: 480 }}>
                {verifiedResult.detectedGender === 'female' ? (
                  <p className="mb-0 small text-dark">
                    <i className="bi bi-gift-fill text-danger me-2" />
                    <strong>Free Chat Unlocked:</strong> Your live female verification is complete. Next, complete your profile to access free chat without requiring Connects!
                  </p>
                ) : (
                  <p className="mb-0 small text-dark">
                    <i className="bi bi-shield-check text-primary me-2" />
                    <strong>Identity Verified:</strong> Your live male verification is complete. Next, complete your profile details to proceed.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="btn btn-wine px-5 py-3 fw-semibold"
                onClick={() => navigate('/profile', { replace: true })}
              >
                Continue to Profile Page <i className="bi bi-arrow-right ms-2" />
              </button>
            </div>
          ) : (
            <>
              {/* Status Banner if retry required */}
              {verificationState === 'VERIFICATION_RESUBMISSION_REQUIRED' && attemptCount > 0 && (
                <div className="alert alert-warning d-flex align-items-center gap-2 text-start small mb-3">
                  <i className="bi bi-exclamation-triangle-fill fs-5 text-warning" />
                  <div>
                    <strong>Retry Live Verification:</strong> Please position your face clearly inside the live camera frame and capture a new live selfie.
                  </div>
                </div>
              )}

              {/* Live Camera / Captured Frame Container (NO FILE UPLOAD ALLOWED) */}
              <div className="camera-frame-wrapper">
                {selfie ? (
                  <>
                    <img src={selfie} alt="Live captured selfie" className="captured-preview" />
                    {isProcessing && (
                      <div className="ai-scan-overlay">
                        <div className="scan-line" />
                        <div className="spinner-border text-info mb-3" role="status" />
                        <h6 className="fw-bold mb-1">AI Live Verification in Progress</h6>
                        <p className="small mb-0 opacity-75">{scanStepText || 'Analyzing facial biometrics & gender match...'}</p>
                      </div>
                    )}
                  </>
                ) : !cameraError ? (
                  <>
                    <Webcam
                      key={cameraKey}
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="camera-video"
                      mirrored={true}
                      videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                      onUserMediaError={() => {
                        setCameraError(true);
                      }}
                    />
                    <div className="face-oval-guide">
                      <div className="face-oval-ring" />
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center text-white p-4 w-100 h-100">
                    <i className="bi bi-camera-video-off display-3 mb-3 text-warning" />
                    <h6 className="fw-bold mb-2">Live Camera Permission Required</h6>
                    <p className="small text-white-50 mb-3" style={{ maxWidth: 340 }}>
                      Photo uploads and gallery selection are disabled for security. Please allow camera access in your browser settings to complete live selfie verification.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm px-4 py-2 fw-semibold"
                      onClick={handleRetryCameraPermission}
                    >
                      <i className="bi bi-arrow-clockwise me-2" /> Retry Camera Access
                    </button>
                  </div>
                )}
              </div>

              {/* Mandatory Live Camera Instructions */}
              <div className="bg-light rounded-3 p-3 text-start small mb-3 border">
                <div className="fw-bold text-dark mb-2">
                  <i className="bi bi-camera-video text-danger me-2" />
                  Live Selfie Verification Instructions:
                </div>
                <div className="guidelines-grid mb-0">
                  <div className="guideline-item">
                    <i className="bi bi-1-circle-fill text-danger" />
                    <span>Allow camera permission</span>
                  </div>
                  <div className="guideline-item">
                    <i className="bi bi-2-circle-fill text-danger" />
                    <span>Position your face inside the frame</span>
                  </div>
                  <div className="guideline-item">
                    <i className="bi bi-3-circle-fill text-danger" />
                    <span>Keep your face clearly visible</span>
                  </div>
                  <div className="guideline-item">
                    <i className="bi bi-4-circle-fill text-danger" />
                    <span>Look directly at the camera</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-top text-muted" style={{ fontSize: '12px' }}>
                  <i className="bi bi-shield-lock-fill text-success me-1" />
                  Capture the selfie only through the live camera. Gallery uploads are not permitted.
                </div>
              </div>

              {/* Live Camera Action Buttons ONLY */}
              {!selfie ? (
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-wine px-5 py-3 fw-semibold w-100"
                    onClick={handleCapture}
                    disabled={!modelsLoaded || isProcessing || cameraError}
                  >
                    <i className="bi bi-camera-fill me-2" />
                    {!modelsLoaded
                      ? 'Loading AI Verification Engine...'
                      : cameraError
                      ? 'Allow Camera Access to Capture'
                      : 'Capture Live Selfie'}
                  </button>
                </div>
              ) : (
                <div className="d-flex gap-3 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-3 fw-semibold w-50"
                    onClick={() => setSelfie(null)}
                    disabled={isProcessing}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2" /> Retake Live Selfie
                  </button>
                  <button
                    type="button"
                    className="btn btn-wine px-4 py-3 fw-semibold w-50"
                    onClick={handleVerifySelfie}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check me-2" />
                        Verify Live Selfie
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                <span>Logged in as <strong>{user?.username}</strong></span>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                  onClick={() => { logout(); navigate('/login'); }}
                  disabled={isProcessing}
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* VERIFICATION FAILED / GENDER MISMATCH / FACE DETECTION ERROR POPUP */}
      {failModal.open && (
        <div className="verify-modal-backdrop" role="dialog" aria-modal="true">
          <div className="verify-modal-card">
            <div className="verify-fail-icon">
              <i className="bi bi-exclamation-octagon-fill" />
            </div>
            <h4 className="fw-bold text-danger mb-2">Verification Failed</h4>
            <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1 mb-3">
              {failModal.isGenderMismatch ? 'Identity & Gender Mismatch' : 'Live Verification Rejected'}
            </span>
            <p className="text-dark fw-medium mb-3">
              {failModal.reason}
            </p>
            <div className="bg-light rounded-3 p-3 text-start small text-secondary mb-4">
              <div className="fw-semibold text-dark mb-1">Please ensure before retrying:</div>
              <ul className="mb-0 ps-3">
                <li>You are capturing a live selfie using your device camera.</li>
                <li>Your face is clearly visible inside the verification frame.</li>
                <li>Your live selfie matches the gender selected during registration (<strong>{selectedGender === 'female' ? 'Female' : 'Male'}</strong>).</li>
                <li>You are in good lighting and looking directly at the camera.</li>
              </ul>
            </div>
            <button
              type="button"
              className="btn btn-wine w-100 py-3 fw-semibold"
              onClick={handleRetryVerification}
            >
              <i className="bi bi-camera-video-fill me-2" /> Retry Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

