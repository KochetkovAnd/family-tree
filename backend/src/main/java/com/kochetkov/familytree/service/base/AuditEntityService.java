package com.kochetkov.familytree.service.base;

import com.kochetkov.familytree.converter.base.BaseConverter;
import com.kochetkov.familytree.dto.auth.base.AuditEntityDTO;
import com.kochetkov.familytree.entity.base.AuditEntity;
import com.kochetkov.familytree.repository.base.AuditEntityRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PROTECTED, makeFinal = true)
public abstract class AuditEntityService<
        Entity extends AuditEntity,
        DTO extends AuditEntityDTO,
        Repository extends AuditEntityRepository<Entity>,
        Converter extends BaseConverter<Entity, DTO>
        > extends BaseIdEntityService<Entity, DTO, Repository, Converter> {

    public AuditEntityService(
            Repository repository,
            Converter converter
    ) {
        super(repository, converter);
    }
}
