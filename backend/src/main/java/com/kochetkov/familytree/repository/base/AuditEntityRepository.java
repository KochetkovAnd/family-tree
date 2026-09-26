package com.kochetkov.familytree.repository.base;

import com.kochetkov.familytree.entity.base.AuditEntity;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface AuditEntityRepository<Entity extends AuditEntity> extends BaseIdEntityRepository<Entity> {
}
