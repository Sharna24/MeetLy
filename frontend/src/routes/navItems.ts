// One list that drives BOTH the sidebar menu and the page routes.
// To add a new page to the app, add one entry here.
export interface NavItem {
  path: string;          // the address, e.g. "/routine"
  label: string;         // the text in the menu
  icon: string;          // emoji shown in the menu
  description: string;   // what this page will do (shown on the placeholder page)
  features?: string;     // which feature numbers from the project plan live here
  placeholder?: boolean; // true = shows "coming soon" until you build the real page
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠', description: 'See which friends are free right now and in your free slots.', features: '5' },
  { path: '/routine', label: 'Routine', icon: '📅', description: 'Build your weekly routine and see your free time.', features: '1, 2', placeholder: true },
  { path: '/friends', label: 'Friends', icon: '👯', description: 'Search people, send and accept friend requests.', features: '3', placeholder: true },
  { path: '/faculty', label: 'Faculty', icon: '🧑‍🏫', description: 'See which faculty members are free, and in which room.', features: '6', placeholder: true },
  { path: '/pokes', label: 'Pokes', icon: '💌', description: 'Send hangout pokes, and accept, reject or suggest another time.', features: '7, 8', placeholder: true },
  { path: '/chat', label: 'Chat', icon: '💬', description: 'Chat with your friends in real time.', features: '9', placeholder: true },
  { path: '/feed', label: 'Feed', icon: '📸', description: 'Share posts and instants with your friends.', features: '10', placeholder: true },
  { path: '/notifications', label: 'Notifications', icon: '🔔', description: 'Friend requests, poke replies, messages and alerts.', features: '12', placeholder: true },
  { path: '/profile', label: 'Profile', icon: '🙂', description: 'Your profile and settings.', features: '11' },
];