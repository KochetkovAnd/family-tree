package com.kochetkov.familytree.entity;

import com.kochetkov.familytree.entity.base.AuditEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "users")
@SequenceGenerator(name = "entity_id_seq_generator", sequenceName = "users_id_seq", allocationSize = 1)
@AttributeOverrides({
        @AttributeOverride(name = "id", column = @Column(name = "users_id")),
        @AttributeOverride(name = "createdAt", column = @Column(name = "users_created_at", nullable = false, updatable = false)),
        @AttributeOverride(name = "createdBy", column = @Column(name = "users_created_by", nullable = false, updatable = false)),
        @AttributeOverride(name = "updatedAt", column = @Column(name = "users_updated_at", nullable = false)),
        @AttributeOverride(name = "updatedBy", column = @Column(name = "users_updated_by", nullable = false)),
        @AttributeOverride(name = "deletedAt", column = @Column(name = "users_deleted_at")),
        @AttributeOverride(name = "deletedBy", column = @Column(name = "users_deleted_by")),
})
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends AuditEntity {

    @Column(nullable = false, unique = true)
    String nickname;

    @Column(nullable = false)
    String passwordHash;

    @Column(nullable = false)
    String displayName;
}
