package com.kochetkov.familytree.entity.base;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditEntity extends BaseIdEntity {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    LocalDateTime createdAt;

    @CreatedBy
    @Column(nullable = false, updatable = false)
    String createdBy;

    @LastModifiedDate
    @Column(nullable = false)
    LocalDateTime updatedAt;

    @LastModifiedBy
    @Column(nullable = false)
    String updatedBy;

    @Column
    LocalDateTime deletedAt;

    @Column
    String deletedBy;
}
