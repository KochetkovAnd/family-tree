-- Base schema: users, family_tree, user_family_tree, person.
--
-- Column naming convention (see CLAUDE.md "Authentication" section): every
-- table's own id/audit columns are prefixed with that table's name
-- (users_id, users_created_at, family_tree_created_by, ...). FK columns are
-- the exception — they name what they reference, not the owning table
-- (user_family_tree.user_id/tree_id, not user_family_tree_user_id).
--
-- Each table gets its own sequence rather than sharing one — see
-- BaseIdEntity/AuditEntity in the backend for why the Java-side generator
-- name is a shared literal even though the underlying Postgres sequence
-- isn't. person_id's sequence is named person_person_id_seq (Postgres's own
-- bigserial auto-naming: <table>_<column>_seq) rather than person_id_seq,
-- because that table/sequence pair already existed by hand before this
-- migration was written — kept as-is rather than renamed for consistency.

CREATE SEQUENCE users_id_seq;
CREATE TABLE users (
    users_id         BIGINT       NOT NULL DEFAULT nextval('users_id_seq') PRIMARY KEY,
    users_created_at TIMESTAMP    NOT NULL,
    users_created_by VARCHAR(255) NOT NULL,
    users_updated_at TIMESTAMP    NOT NULL,
    users_updated_by VARCHAR(255) NOT NULL,
    users_deleted_at TIMESTAMP,
    users_deleted_by VARCHAR(255),
    nickname      VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    CONSTRAINT uk_users_nickname UNIQUE (nickname)
);
ALTER SEQUENCE users_id_seq OWNED BY users.users_id;

CREATE SEQUENCE family_tree_id_seq;
CREATE TABLE family_tree (
    family_tree_id         BIGINT       NOT NULL DEFAULT nextval('family_tree_id_seq') PRIMARY KEY,
    family_tree_created_at TIMESTAMP    NOT NULL,
    family_tree_created_by VARCHAR(255) NOT NULL,
    family_tree_updated_at TIMESTAMP    NOT NULL,
    family_tree_updated_by VARCHAR(255) NOT NULL,
    family_tree_deleted_at TIMESTAMP,
    family_tree_deleted_by VARCHAR(255),
    name VARCHAR(255) NOT NULL
);
ALTER SEQUENCE family_tree_id_seq OWNED BY family_tree.family_tree_id;

-- Join row granting a user access to a tree. No role/permission column yet —
-- presence of a row means full access (see docs/api.md).
CREATE SEQUENCE user_family_tree_id_seq;
CREATE TABLE user_family_tree (
    user_family_tree_id         BIGINT       NOT NULL DEFAULT nextval('user_family_tree_id_seq') PRIMARY KEY,
    user_family_tree_created_at TIMESTAMP    NOT NULL,
    user_family_tree_created_by VARCHAR(255) NOT NULL,
    user_family_tree_updated_at TIMESTAMP    NOT NULL,
    user_family_tree_updated_by VARCHAR(255) NOT NULL,
    user_family_tree_deleted_at TIMESTAMP,
    user_family_tree_deleted_by VARCHAR(255),
    user_id BIGINT NOT NULL REFERENCES users(users_id),
    tree_id BIGINT NOT NULL REFERENCES family_tree(family_tree_id),
    CONSTRAINT uk_user_family_tree_user_tree UNIQUE (user_id, tree_id)
);
ALTER SEQUENCE user_family_tree_id_seq OWNED BY user_family_tree.user_family_tree_id;

-- Not yet scoped to a family_tree (no family_tree_id) — Person isn't tied to
-- a specific tree yet, see the entity's own comment for why.
CREATE SEQUENCE person_person_id_seq;
CREATE TABLE person (
    person_id         BIGINT    NOT NULL DEFAULT nextval('person_person_id_seq') PRIMARY KEY,
    person_created_at TIMESTAMP NOT NULL DEFAULT now(),
    person_created_by TEXT      NOT NULL,
    person_updated_at TIMESTAMP NOT NULL DEFAULT now(),
    person_updated_by TEXT      NOT NULL,
    person_deleted_at TIMESTAMP,
    person_deleted_by TEXT,
    person_lastname   TEXT NOT NULL,
    person_firstname  TEXT NOT NULL,
    person_secondname TEXT,
    person_birthday   DATE,
    person_birthplace TEXT
);
ALTER SEQUENCE person_person_id_seq OWNED BY person.person_id;
