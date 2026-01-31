-- Seed volleyball drills
-- System drills are shared across all coaches (created_by = NULL, is_system_drill = true)
-- Coaches can add their own drills which will have their ID as created_by

-- ============================================
-- PASSING DRILLS (Level 1-4)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Butterfly Passing',
 'Basic passing drill in butterfly pattern. Players form two lines and pass across, following their pass to the opposite line. Focus on proper platform and footwork.',
 ARRAY['passing', 'footwork'], 1, 6, 12, ARRAY['2-3 balls'], 10, NULL, true),

('Partner Passing',
 'Players pair up and pass back and forth, focusing on control and accuracy. Start close and gradually increase distance. Emphasize proper passing technique and communication.',
 ARRAY['passing'], 2, 2, 20, ARRAY['1 ball per pair'], 15, NULL, true),

('Triangle Passing',
 'Three players form a triangle. Pass in a pattern (A to B, B to C, C to A). Focus on accurate target passing and movement after passing.',
 ARRAY['passing', 'transition'], 2, 3, 18, ARRAY['1 ball per group'], 12, NULL, true),

('Serve Receive Pattern',
 'Players in serve-receive formation. Coach tosses or serves, team passes to target. Rotate positions. Focus on platform angle and footwork to target.',
 ARRAY['serve-receive', 'passing'], 3, 6, 12, ARRAY['balls', 'target'], 20, NULL, true),

('Competitive Passing',
 'Two teams compete for most consecutive passes. Add challenges: pass over net, pass to moving targets, or timed rounds. Emphasizes consistency under pressure.',
 ARRAY['passing'], 4, 4, 12, ARRAY['balls', 'net'], 15, NULL, true);

-- ============================================
-- SETTING DRILLS (Level 1-4)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Wall Setting',
 'Set against a wall to develop hand contact and consistency. Focus on proper hand shape, wrist snap, and follow-through. Start at various distances from wall.',
 ARRAY['setting'], 1, 1, 12, ARRAY['balls', 'wall'], 10, NULL, true),

('Partner Setting',
 'Partners set back and forth. Focus on hand position, clean contact, and accuracy. Vary height and distance. Call ball before setting.',
 ARRAY['setting'], 2, 2, 20, ARRAY['1 ball per pair'], 15, NULL, true),

('Triangle Setting',
 'Three players: passer, setter, target. Passer sends ball to setter, setter sets to target. Rotate positions. Focus on footwork to ball and setting location.',
 ARRAY['setting', 'transition'], 3, 3, 12, ARRAY['balls'], 15, NULL, true),

('Quick Set Practice',
 'Setter works with middle blocker on quick sets (1s). Focus on timing, low sets, and fast tempo. Gradually add approach and hitting.',
 ARRAY['setting', 'hitting'], 4, 2, 6, ARRAY['balls', 'net'], 20, NULL, true),

('Out-of-System Setting',
 'Setter must set from various difficult positions. Toss errant passes, setter must get to ball and deliver settable ball. Develops court awareness and footwork.',
 ARRAY['setting', 'transition'], 4, 2, 8, ARRAY['balls'], 15, NULL, true);

-- ============================================
-- HITTING DRILLS (Level 1-4)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Approach Footwork',
 'Practice 3-step or 4-step approach without ball. Focus on footwork pattern, arm swing, and explosive jump. Do in slow motion, then build speed.',
 ARRAY['hitting', 'footwork'], 1, 1, 12, ARRAY[]::text[], 10, NULL, true),

('Standing Hit',
 'Stand on box or near net and hit tossed balls. Focus on arm swing, wrist snap, and contact point. No approach initially.',
 ARRAY['hitting'], 2, 1, 6, ARRAY['balls', 'box', 'net'], 15, NULL, true),

('Full Approach Hitting',
 'Complete approach and hit from set ball. Focus on timing, approach angle, and aggressive swing. Start from various court positions.',
 ARRAY['hitting', 'footwork'], 3, 2, 8, ARRAY['balls', 'net'], 20, NULL, true),

('Live Hitting vs Block',
 'Hitters attack against live blockers. Setter delivers sets, hitter must read block and adjust shot. Focus on shot selection and tool usage.',
 ARRAY['hitting', 'blocking'], 4, 6, 12, ARRAY['balls', 'net'], 20, NULL, true),

('Cross-Court vs Line Hitting',
 'Practice hitting both cross-court and down the line. Place targets in corners. Develop ability to hit to different zones on command.',
 ARRAY['hitting'], 3, 2, 8, ARRAY['balls', 'targets', 'net'], 15, NULL, true);

-- ============================================
-- SERVING DRILLS (Level 1-5)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Standing Float Serve',
 'Standing position, toss and contact for float serve. Focus on consistent toss, firm wrist, and flat contact. No spin on ball.',
 ARRAY['serving'], 1, 1, 12, ARRAY['balls', 'net'], 10, NULL, true),

('Float Serve from Endline',
 'Full float serve from serving position. Focus on toss placement, approach steps, and consistent contact. Track serve accuracy.',
 ARRAY['serving'], 2, 1, 12, ARRAY['balls', 'net'], 15, NULL, true),

('Target Serving',
 'Place targets (cones, zones) on court. Serve to specific zones. Develop accuracy and ability to serve strategically.',
 ARRAY['serving'], 3, 1, 12, ARRAY['balls', 'targets', 'net'], 15, NULL, true),

('Jump Float Serve',
 'Approach with steps and jump, contact ball at peak of jump. Focus on timing, consistent toss, and float contact. More aggressive than standing.',
 ARRAY['serving'], 3, 1, 12, ARRAY['balls', 'net'], 20, NULL, true),

('Jump Topspin Serve',
 'Full approach jump serve with topspin. High-level aggressive serve. Focus on powerful approach, high contact, and wrist snap for spin.',
 ARRAY['serving'], 5, 1, 12, ARRAY['balls', 'net'], 20, NULL, true);

-- ============================================
-- BLOCKING DRILLS (Level 1-3)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Blocking Footwork',
 'Practice side-step movement along net. Focus on staying low, quick feet, and maintaining ready position. Add jump at positions.',
 ARRAY['blocking', 'footwork'], 1, 1, 12, ARRAY['net'], 10, NULL, true),

('Shadow Blocking',
 'Coach stands opposite and simulates hitting motion. Blocker responds with proper timing and hand position. No ball initially.',
 ARRAY['blocking'], 2, 1, 6, ARRAY['net'], 12, NULL, true),

('Live Blocking',
 'Block against live hitters. Focus on reading hitter, timing jump, and penetrating hands over net. Practice solo and double blocks.',
 ARRAY['blocking'], 3, 4, 12, ARRAY['balls', 'net'], 20, NULL, true);

-- ============================================
-- DEFENSE DRILLS (Level 1-3)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Shuffle Drill',
 'Players start at center back, shuffle to corner on coach signal, dig tossed ball, return to center. Develops lateral movement and court coverage.',
 ARRAY['defense', 'footwork'], 1, 1, 6, ARRAY['balls'], 12, NULL, true),

('Dig Lines',
 'Players form line, coach hits balls at them. Focus on low platform, quick feet, and controlled digs. Add movement before dig.',
 ARRAY['defense'], 2, 3, 12, ARRAY['balls'], 15, NULL, true),

('Transition Defense',
 'Players must dig attacked ball, then transition to cover position or prepare for next attack. Simulates game-like defensive sequences.',
 ARRAY['defense', 'transition'], 3, 6, 12, ARRAY['balls', 'net'], 20, NULL, true);

-- ============================================
-- CONDITIONING DRILLS (Level 1-2)
-- ============================================

INSERT INTO drills (name, description, skill_tags, progression_level, min_players, max_players, equipment_needed, duration_minutes, created_by, is_system_drill) VALUES
('Ladder Drills',
 'Agility ladder drills for footwork. Various patterns: one foot, two feet, lateral, etc. Develops quick feet and coordination.',
 ARRAY['footwork', 'conditioning'], 1, 1, 20, ARRAY['agility ladder'], 10, NULL, true),

('Court Sprints',
 'Sprint from endline to endline, sideline to sideline. Add volleyball movements: shuffle, backpedal, dive and recover. Builds conditioning.',
 ARRAY['conditioning', 'footwork'], 2, 1, 20, ARRAY[]::text[], 15, NULL, true),

('Suicide Runs',
 'Touch each line on court in sequence: attack line, center line, far attack line, far endline. Return to start. Repeat for conditioning.',
 ARRAY['conditioning', 'footwork'], 2, 1, 20, ARRAY[]::text[], 10, NULL, true);

-- ============================================
-- PROGRESSION LINKS
-- ============================================
-- Link drills in progression chains (parent -> child relationships)

-- Passing progression: Butterfly -> Partner -> Serve Receive -> Competitive
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Butterfly Passing')
WHERE name = 'Partner Passing';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Partner Passing')
WHERE name = 'Serve Receive Pattern';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Serve Receive Pattern')
WHERE name = 'Competitive Passing';

-- Setting progression: Wall -> Partner -> Triangle -> Quick/Out-of-System
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Wall Setting')
WHERE name = 'Partner Setting';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Partner Setting')
WHERE name = 'Triangle Setting';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Triangle Setting')
WHERE name IN ('Quick Set Practice', 'Out-of-System Setting');

-- Hitting progression: Approach -> Standing -> Full Approach -> Live/Cross-Court
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Approach Footwork')
WHERE name = 'Standing Hit';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Standing Hit')
WHERE name = 'Full Approach Hitting';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Full Approach Hitting')
WHERE name IN ('Live Hitting vs Block', 'Cross-Court vs Line Hitting');

-- Serving progression: Standing -> Endline -> Target/Jump Float -> Jump Topspin
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Standing Float Serve')
WHERE name = 'Float Serve from Endline';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Float Serve from Endline')
WHERE name IN ('Target Serving', 'Jump Float Serve');

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Jump Float Serve')
WHERE name = 'Jump Topspin Serve';

-- Blocking progression: Footwork -> Shadow -> Live
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Blocking Footwork')
WHERE name = 'Shadow Blocking';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Shadow Blocking')
WHERE name = 'Live Blocking';

-- Defense progression: Shuffle -> Dig Lines -> Transition
UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Shuffle Drill')
WHERE name = 'Dig Lines';

UPDATE drills SET parent_drill_id = (SELECT id FROM drills WHERE name = 'Dig Lines')
WHERE name = 'Transition Defense';
