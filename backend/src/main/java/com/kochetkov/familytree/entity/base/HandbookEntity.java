package com.kochetkov.familytree.entity.base;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@MappedSuperclass
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public abstract class HandbookEntity extends BaseIdEntity {

    @Column(nullable = false)
    String code;

    @Column(nullable = false)
    String name;
}
