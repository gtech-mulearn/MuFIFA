-- SQL Schema for μFIFA Tasks & XP Progression

-- 1. Create the `tasks` metadata table
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_desc TEXT,
    guidelines TEXT,
    action_label VARCHAR(100) DEFAULT 'View Details',
    action_url VARCHAR(255) DEFAULT '#',
    mupoint INT DEFAULT 0,
    xp_creativity INT DEFAULT 0,
    xp_branding INT DEFAULT 0,
    xp_innovation INT DEFAULT 0,
    xp_teamwork INT DEFAULT 0,
    xp_execution INT DEFAULT 0,
    tier INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) if required, or bypass if using service role key
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of tasks" ON tasks;
CREATE POLICY "Allow public read of tasks" ON tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write of tasks" ON tasks;
CREATE POLICY "Allow admin write of tasks" ON tasks FOR ALL USING (true);

-- 2. Create the `user_completed_tasks` table to store completions and XP category breakdown
CREATE TABLE IF NOT EXISTS user_completed_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES registrations(user_id) ON DELETE CASCADE,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_awarded INT DEFAULT 0,
    xp_creativity INT DEFAULT 0,
    xp_branding INT DEFAULT 0,
    xp_innovation INT DEFAULT 0,
    xp_teamwork INT DEFAULT 0,
    xp_execution INT DEFAULT 0,
    UNIQUE(user_id, task_id)
);

ALTER TABLE user_completed_tasks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of completed tasks" ON user_completed_tasks;
CREATE POLICY "Allow public read of completed tasks" ON user_completed_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write of completed tasks" ON user_completed_tasks;
CREATE POLICY "Allow admin write of completed tasks" ON user_completed_tasks FOR ALL USING (true);

-- 3. Seed Core Tasks 1, 2, and 3
INSERT INTO tasks (
    id, 
    title, 
    description, 
    short_desc, 
    guidelines, 
    action_label, 
    action_url, 
    mupoint, 
    xp_creativity, 
    xp_branding, 
    xp_innovation, 
    xp_teamwork, 
    xp_execution, 
    tier
) VALUES 
(
    1,
    'Referral Program Challenge',
    'Invite a minimum of 1 user to μFIFA and gain +5 points to level up your favorite team.',
    'Invite a minimum of 1 user to μFIFA and gain +5 points to level up your favorite team.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-violet-400 font-bold shrink-0 mt-0.5">•</span><span>Generate your unique pass referral link from the dashboard.</span></li><li class="flex items-start gap-2"><span class="text-violet-400 font-bold shrink-0 mt-0.5">•</span><span>Invite a minimum of 1 user to register for μFIFA''26 using your link.</span></li><li class="flex items-start gap-2"><span class="text-violet-400 font-bold shrink-0 mt-0.5">•</span><span>Once they successfully register, you gain +5 μPoints and level up your favorite team.</span></li></ul>',
    'Go to Dashboard',
    '/dashboard',
    5,
    0,
    0,
    0,
    50,
    0,
    1
),
(
    2,
    'Profile Page Update',
    'Customize your profile, add a bio, and make at least 1 prediction.',
    'Customize your profile, add a bio, and make at least 1 prediction.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Verify your credentials by personalizing your profile settings.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Open your Player Profile tab and click on the "Edit Details" menu.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Input your college/institution alongside a biography describing your specialization.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Provide your µID (µLearn ID) in your profile.</span></li><li class="flex items-start gap-2"><span class="text-cyan-400 font-bold shrink-0 mt-0.5">•</span><span>Submit at least 1 prediction on the match dashboard (outcome doesn''t matter).</span></li></ul>',
    'Go to Profile',
    '/profile',
    5,
    20,
    20,
    20,
    20,
    20,
    1
),
(
    3,
    'GitHub Contribution',
    'Fork the repository, create your player card in the /profile directory, and open a Pull Request.',
    'Fork the repository, create your player card in the /profile directory, and open a Pull Request.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span><span>Fork the repository to your own GitHub profile.</span></li><li class="flex items-start gap-2"><span class="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span><span>Create a new Markdown file inside the <code>/profile</code> directory, named using your MUID (e.g. <code>profile/yourname@mulearn.md</code>).</span></li><li class="flex items-start gap-2"><span class="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span><span>Fill out your profile, link your Discord profile card embed, and open a Pull Request targeting the main branch.</span></li></ul>',
    'Go to Repository',
    'https://github.com/gtech-mulearn/mufifa-2026',
    5,
    0,
    0,
    0,
    0,
    100,
    1
),
(
    4,
    'Match Day Tactician',
    'Submit at least 3 match predictions to test your strategic intuition.',
    'Submit at least 3 match predictions to test your strategic intuition.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-rose-400 font-bold shrink-0 mt-0.5">•</span><span>Navigate to the Match Fixtures page.</span></li><li class="flex items-start gap-2"><span class="text-rose-400 font-bold shrink-0 mt-0.5">•</span><span>Submit a minimum of 3 separate match predictions.</span></li><li class="flex items-start gap-2"><span class="text-rose-400 font-bold shrink-0 mt-0.5">•</span><span>Verify here once completed to log your progress.</span></li></ul>',
    'Predict Matches',
    '/match',
    10,
    0,
    0,
    0,
    0,
    0,
    2
),
(
    5,
    'Squad Synergy Challenge',
    'Accumulate a total of 20 μPoints on your profile scorecard.',
    'Accumulate a total of 20 μPoints on your profile scorecard.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-amber-400 font-bold shrink-0 mt-0.5">•</span><span>Participate in referrals and predictions.</span></li><li class="flex items-start gap-2"><span class="text-amber-400 font-bold shrink-0 mt-0.5">•</span><span>Earn a total of 20 μPoints on your scorecard.</span></li><li class="flex items-start gap-2"><span class="text-amber-400 font-bold shrink-0 mt-0.5">•</span><span>Verify your total points below.</span></li></ul>',
    'View Leaderboard',
    '/leaderboard',
    5,
    0,
    0,
    0,
    0,
    0,
    2
),
(
    6,
    'Discord Integration',
    'Add your Discord username/tag in your profile socials.',
    'Add your Discord username/tag in your profile socials.',
    '<ul class="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0"><li class="flex items-start gap-2"><span class="text-indigo-400 font-bold shrink-0 mt-0.5">•</span><span>Navigate to your profile page.</span></li><li class="flex items-start gap-2"><span class="text-indigo-400 font-bold shrink-0 mt-0.5">•</span><span>Enter your Discord username under socials in the "Edit Details" panel.</span></li><li class="flex items-start gap-2"><span class="text-indigo-400 font-bold shrink-0 mt-0.5">•</span><span>Click verify to register your Discord membership status.</span></li></ul>',
    'Link Socials',
    '/profile',
    15,
    0,
    0,
    0,
    0,
    0,
    2
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    short_desc = EXCLUDED.short_desc,
    guidelines = EXCLUDED.guidelines,
    action_label = EXCLUDED.action_label,
    action_url = EXCLUDED.action_url,
    mupoint = EXCLUDED.mupoint,
    xp_creativity = EXCLUDED.xp_creativity,
    xp_branding = EXCLUDED.xp_branding,
    xp_innovation = EXCLUDED.xp_innovation,
    xp_teamwork = EXCLUDED.xp_teamwork,
    xp_execution = EXCLUDED.xp_execution,
    tier = EXCLUDED.tier;
