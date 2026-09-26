package com.kochetkov.familytree.repository.base;

import com.kochetkov.familytree.entity.base.BaseIdEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface BaseIdEntityRepository<Entity extends BaseIdEntity> extends JpaRepository<Entity, Long> {
}
