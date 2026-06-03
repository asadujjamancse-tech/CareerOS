export const version = '003_seed_categories'
export const name = '003_seed_categories.sql'

export const sql = `
INSERT OR IGNORE INTO skill_categories (id, name, description, color_hex, icon, order_index) VALUES
  ('cat_languages',    'Programming Languages', 'Core programming and scripting languages',      '#3B82F6', 'code',          1),
  ('cat_frontend',     'Frontend',              'UI frameworks, CSS, browser APIs',               '#8B5CF6', 'monitor',       2),
  ('cat_backend',      'Backend',               'Server-side frameworks, APIs, services',         '#10B981', 'server',        3),
  ('cat_databases',    'Databases',             'Relational, document, graph, and key-value DBs', '#F59E0B', 'database',      4),
  ('cat_devops',       'DevOps & Cloud',        'CI/CD, containers, cloud platforms',             '#EF4444', 'cloud',         5),
  ('cat_mobile',       'Mobile',                'iOS, Android, and cross-platform development',   '#06B6D4', 'smartphone',    6),
  ('cat_ai_ml',        'AI & Machine Learning', 'Models, frameworks, MLOps',                      '#EC4899', 'brain',         7),
  ('cat_architecture', 'Architecture',          'System design, patterns, principles',            '#6366F1', 'layers',        8),
  ('cat_tools',        'Tools & Workflow',      'IDEs, version control, project management',      '#84CC16', 'wrench',        9),
  ('cat_soft_skills',  'Soft Skills',           'Communication, leadership, collaboration',       '#F97316', 'users',        10);
`
