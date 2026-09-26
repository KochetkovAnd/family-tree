package com.kochetkov.familytree.converter.base;

import com.kochetkov.familytree.dto.auth.base.BaseIdEntityDTO;
import com.kochetkov.familytree.entity.base.BaseIdEntity;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.BeanUtils;

import java.util.List;
import java.util.function.Supplier;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public abstract class AbstractConverter<Entity extends BaseIdEntity, DTO extends BaseIdEntityDTO> implements BaseConverter<Entity, DTO> {

    Supplier<Entity> entitySupplier;
    Supplier<DTO> dtoSupplier;

    private static final String[] IGNORED_ON_WRITE = {
            "id", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy",
    };

    @Override
    public Entity toEntity(DTO dto) {
        return toEntity(dto, entitySupplier.get());
    }

    @Override
    public Entity toEntity(DTO dto, Entity entity) {
        BeanUtils.copyProperties(dto, entity, IGNORED_ON_WRITE);
        toEntityAfter(entity, dto);
        return entity;
    }

    @Override
    public DTO toDTO(Entity entity) {
        DTO dto = dtoSupplier.get();
        BeanUtils.copyProperties(entity, dto);
        toDTOAfter(dto, entity);
        return dto;
    }

    protected void toEntityAfter(Entity entity, DTO dto) {}

    protected void toDTOAfter(DTO dto, Entity entity) {}

    @Override
    public List<Entity> toListEntity(List<DTO> dtos) {
        return dtos.stream().map(this::toEntity).toList();
    }

    @Override
    public List<DTO> toListDTO(List<Entity> entities) {
        return entities.stream().map(this::toDTO).toList();
    }
}
