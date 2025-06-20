// Demo accounts and sample data for interviewers
export const demoAccounts = [
  {
    username: 'alice_demo',
    email: 'alice.demo@chatflow.dev',
    password: 'Demo123!',
    avatarImage: 'https://api.multiavatar.com/alice.svg',
    isEmailVerified: true
  },
  {
    username: 'bob_demo',
    email: 'bob.demo@chatflow.dev',
    password: 'Demo123!',
    avatarImage: 'https://api.multiavatar.com/bob.svg',
    isEmailVerified: true
  },
  {
    username: 'charlie_demo',
    email: 'charlie.demo@chatflow.dev',
    password: 'Demo123!',
    avatarImage: 'https://api.multiavatar.com/charlie.svg',
    isEmailVerified: true
  }
];

export const sampleMessages = [
  {
    text: "Welcome to ChatFlow! 👋 This is a demo of our real-time messaging system.",
    fromSelf: false,
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    text: "Try sending a message, making a video call, or sharing a file!",
    fromSelf: false,
    timestamp: new Date(Date.now() - 3000000) // 50 minutes ago
  },
  {
    text: "Features to test: real-time messaging, video calls, file sharing, message deletion, and theme switching.",
    fromSelf: true,
    timestamp: new Date(Date.now() - 2400000) // 40 minutes ago
  },
  {
    text: "Perfect for demonstrating to interviewers! 🚀",
    fromSelf: false,
    timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
  }
];

export const demoCallHistory = [
  {
    type: 'video',
    status: 'completed',
    duration: 180, // 3 minutes
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    participants: ['alice_demo', 'bob_demo']
  },
  {
    type: 'voice',
    status: 'missed',
    duration: 0,
    timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
    participants: ['charlie_demo', 'alice_demo']
  }
];

// Helper function to check if running in demo mode
export const isDemoMode = () => {
  return process.env.REACT_APP_DEMO_MODE === 'true';
};

// Demo login helper
export const getDemoCredentials = (userType = 'alice') => {
  const user = demoAccounts.find(account => 
    account.username.includes(userType.toLowerCase())
  );
  return user ? { email: user.email, password: user.password } : null;
};
