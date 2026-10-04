-- Two demo users, one family tree each, no people in either tree yet.
-- Both accounts use the same test password: "password123".
-- This is dev seed data — drop/replace this migration before any real deploy
-- (Flyway migrations are meant to be immutable once applied anywhere that
-- matters; this one only exists to make local dev usable out of the box).

-- pgcrypto's crypt()/gen_salt('bf') produces a real bcrypt hash ($2a$...)
-- that Spring Security's BCryptPasswordEncoder can verify directly — this
-- is NOT a fake/placeholder hash.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (users_created_at, users_created_by, users_updated_at, users_updated_by, nickname, password_hash, display_name)
VALUES
    (now(), 'system', now(), 'system', 'ivan', crypt('password123', gen_salt('bf')), 'Иван Иванов'),
    (now(), 'system', now(), 'system', 'maria', crypt('password123', gen_salt('bf')), 'Мария Петрова');

INSERT INTO family_tree (family_tree_created_at, family_tree_created_by, family_tree_updated_at, family_tree_updated_by, name)
VALUES
    (now(), 'system', now(), 'system', 'Дерево Ивановых'),
    (now(), 'system', now(), 'system', 'Дерево Петровых');

INSERT INTO user_family_tree (user_family_tree_created_at, user_family_tree_created_by, user_family_tree_updated_at, user_family_tree_updated_by, user_id, tree_id)
VALUES
    (now(), 'system', now(), 'system',
     (SELECT users_id FROM users WHERE nickname = 'ivan'),
     (SELECT family_tree_id FROM family_tree WHERE name = 'Дерево Ивановых')),
    (now(), 'system', now(), 'system',
     (SELECT users_id FROM users WHERE nickname = 'maria'),
     (SELECT family_tree_id FROM family_tree WHERE name = 'Дерево Петровых'));
