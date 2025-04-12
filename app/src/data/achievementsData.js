// (Could be in achievementsData.js)
export const achievementsList = [
  {
    id: 'streak_3',
    name: 'Consistent Learner',
    description: 'Maintain a 3-day learning streak!',
    icon: 'flame-outline', // Ionicons name
    criteria: (stats) => stats.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day learning streak!',
    icon: 'flame',
  },
  {
    id: 'streak_10',
    name: 'Streak Star', // The one you mentioned!
    description: 'Achieve a 10-day learning streak!',
    icon: 'star',
  },
  {
    id: 'stages_1',
    name: 'First Step',
    description: 'Complete your first stage.',
    icon: 'footsteps-outline',
  },
  {
    id: 'stages_25',
    name: 'Quarter Century',
    description: 'Complete 25 stages.',
    icon: 'rocket-outline',
  },
  {
    id: 'stages_100',
    name: 'Centurion',
    description: 'Complete 100 stages!',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'track_1',
    name: 'Track Tackler',
    description: 'Complete your first full track.',
    icon: 'ribbon-outline',
  },
  {
    id: 'track_5',
    name: 'Curriculum Conqueror',
    description: 'Complete 5 different tracks.',
    icon: 'trophy-outline',
  },
   {
    id: 'track_created_1',
    name: 'AI Collaborator',
    description: 'Create your first track using AI.',
    icon: 'sparkles-outline',
  },
  // Add more creative achievements!
];

// Helper to get achievement details by ID
export const getAchievementById = (id) => {
  return achievementsList.find(ach => ach.id === id);
}