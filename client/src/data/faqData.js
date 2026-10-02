export const FAQ_CATEGORIES = [
  { id: 'all', name: 'All Questions' },
  { id: 'account', name: 'Account' },
  { id: 'verification', name: 'Verification' },
  { id: 'profiles', name: 'Profiles & Discovery' },
  { id: 'privacy', name: 'Privacy & Discretion' },
  { id: 'communication', name: 'Chat & Messages' },
  { id: 'connects', name: 'Connects & Billing' },
  { id: 'notifications', name: 'Notifications' },
]

export const FAQ_ITEMS = [
  // 1. Account
  {
    category: 'account',
    q: 'How do I create an account on SWAY?',
    a: 'Click on "Register" in the navigation menu or landing page. Select your biological gender (Female or Male), choose a unique username, provide your email, password, date of birth (must be 18+), and your general city/state. Once submitted, you will immediately proceed to our quick Live Camera AI Selfie Verification.',
  },
  {
    category: 'account',
    q: 'How do I complete my profile after registering?',
    a: 'After successful selfie verification, you can access your Profile page to upload primary photos, add an authentic bio, select relationship expectations, hobbies, lifestyle preferences (e.g. drinking, smoking), education, and profession. A completed profile receives significantly higher engagement from verified members.',
  },
  {
    category: 'account',
    q: 'Can I edit my profile details later?',
    a: 'Yes, absolutely. You can update your bio, lifestyle preferences, relationship expectations, photos, and location at any time by visiting "My Profile" and selecting "Edit Profile". Your verified gender remains locked to prevent identity tampering.',
  },

  // 2. Verification
  {
    category: 'verification',
    q: 'Why is live verification mandatory on SWAY?',
    a: 'SWAY is an exclusive ecosystem built around safety, respect, and zero fraud. Mandatory live verification ensures that 100% of our members are authentic human beings who match their declared gender. It completely eliminates catfishing, bots, commercial spam, and fake profiles.',
  },
  {
    category: 'verification',
    q: 'How does live selfie verification work?',
    a: 'During registration or onboarding, our secure camera module accesses your device camera in real time. It performs a liveness check and biometric facial analysis to confirm you are present and verifies your gender. The entire process takes less than 10 seconds.',
  },
  {
    category: 'verification',
    q: 'Can I upload an existing photo or screenshot for verification?',
    a: 'No. To guarantee genuine human liveness and prevent fraudulent photo manipulation, static photo uploads from phone galleries or desktops are strictly rejected. Verification requires live camera activation on your phone, laptop, or webcam.',
  },
  {
    category: 'verification',
    q: 'Is my verification selfie shown publicly on my profile?',
    a: 'No. Your verification selfie is processed securely by our verification engine solely to confirm your identity and gender. It is not displayed on your public profile or shared with other members unless you choose to set it as your public avatar.',
  },

  // 3. Profiles & Discovery
  {
    category: 'profiles',
    q: 'Who can view my profile on SWAY?',
    a: 'Only authenticated and verified members can view profiles on SWAY. Non-registered visitors, web search crawlers, and unverified users have zero access to member directory pages, photos, or personal information.',
  },
  {
    category: 'profiles',
    q: 'How does nearby discovery work?',
    a: 'Our smart discovery engine computes approximate distance based on your general city or device location coordinates. It allows you to find members within your preferred radius (e.g. 10km, 25km, 50km). Your exact GPS pin and street address are never collected or displayed.',
  },
  {
    category: 'profiles',
    q: 'Can I block or report another user?',
    a: 'Yes. Every profile and chat screen features an instant "Block" and "Report" option. Blocking immediately removes the user from your discovery, chat list, and notifications. Reporting alerts our 24/7 administrative moderation team for prompt action.',
  },

  // 4. Privacy & Discretion
  {
    category: 'privacy',
    q: 'Who can see my phone number and personal contact details?',
    a: 'By default, your phone number and email are completely hidden. You have full granular control over contact visibility. Female members have dedicated permission settings to allow or restrict phone access on a profile-by-profile basis.',
  },
  {
    category: 'privacy',
    q: 'Can I control who sees my social media links (Instagram, Facebook, Telegram)?',
    a: 'Yes. In your Privacy Settings, you can choose to hide your Instagram, Facebook, and Telegram handles globally. Furthermore, female members have full authority to grant or revoke social handle visibility to specific male connections.',
  },
  {
    category: 'privacy',
    q: 'What are Private Photos and how do Photo Requests work?',
    a: 'Private Photos are additional gallery images that remain blurred and locked to the public. If another member wishes to view them, they must submit a formal "Private Photo Request". You receive a real-time notification and can accept or decline the request at your discretion.',
  },
  {
    category: 'privacy',
    q: 'Can I blur my profile photo for discretion?',
    a: 'Yes. SWAY includes a built-in Face Blur toggle in your Privacy Settings. When enabled, your primary photo is softly blurred on discovery feeds, allowing you to reveal it only to members you choose to interact with.',
  },

  // 5. Communication (Chat vs Private Messages)
  {
    category: 'communication',
    q: 'What is Chat and how does it work?',
    a: 'Chat is a fast, interactive session designed for real-time live conversation when both members are active. Sessions remain open while active conversation occurs and automatically reset after inactivity to preserve member privacy.',
  },
  {
    category: 'communication',
    q: 'What are Private Messages and how do they differ from Chat?',
    a: 'Private Messages are direct messages intended for long-term, focused communication. Unlike quick chat sessions, Private Messages stay accessible in your dedicated inbox for up to 72 hours, allowing meaningful exchanges without time pressure.',
  },
  {
    category: 'communication',
    q: 'Do female members have to pay or use Connects to message?',
    a: 'No. To maintain a vibrant, balanced, and female-empowered community, all verified female members enjoy 100% complimentary access to start, read, and reply to all chats and Private Messages.',
  },

  // 6. Connects & Billing
  {
    category: 'connects',
    q: 'What are Connects and why are they used?',
    a: 'Connects are platform credits used by male members to initiate communications, send special Crushes, or request private photo access. Connects ensure thoughtful, intentional messaging and deter aggressive spamming. Female members are fully exempt from Connect requirements.',
  },
  {
    category: 'connects',
    q: 'When are Connects deducted from my balance?',
    a: 'Connects are deducted only when you perform specific actions: initiating a new Chat session, sending a Private Message, sending a Crush, or unlocking a Private Photo Request. Browsing profiles and viewing public photos is always free.',
  },
  {
    category: 'connects',
    q: 'How do I purchase Connect packs?',
    a: 'Visit the "Buy Connects" page from your topbar or profile. Select from our transparent starter, popular, or VIP packages. Payments are securely processed via Razorpay supporting UPI, credit cards, debit cards, and net banking.',
  },
  {
    category: 'connects',
    q: 'What happens if I run out of Connects during a conversation?',
    a: 'If your Connect balance is insufficient, a friendly modal will notify you with a direct one-tap option to replenish your Connects and continue your conversation without losing your message history.',
  },

  // 7. Notifications
  {
    category: 'notifications',
    q: 'How do notifications work on SWAY?',
    a: 'SWAY delivers instant notifications for new Chat messages, incoming Private Messages, Likes, Crushes, and Private Photo Requests via secure WebSockets. You can review all past alerts organized neatly by Today, Yesterday, and Earlier in your Notifications center.',
  },
  {
    category: 'notifications',
    q: 'Why did I receive a Private Photo Request notification?',
    a: 'Another verified member browsed your profile, admired your public presentation, and requested permission to view your locked private photos. You have total freedom to view their profile and either approve or decline the request.',
  },
]
